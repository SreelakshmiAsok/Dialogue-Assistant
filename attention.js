// attention.js - Real-time attention detection using MediaPipe Face Mesh
// Tracks head pose via facial landmarks. If the child looks away for > 5s,
// triggers a gentle mascot wave + soft voice prompt with the child's name.

window.AttentionSystem = (function () {

  // ── Config ────────────────────────────────────────────────────────────────
  const INATTENTION_THRESHOLD_MS = 5000;   // 5 s before alert fires
  const YAW_LIMIT   = 0.18;  // nose-drift ratio: >18% of face width = looking away L/R
  const PITCH_LIMIT = 0.20;  // nose-drift ratio: >20% of face height = looking up/down
  const RECHECK_INTERVAL_MS = 200;          // how often we sample landmark result

  // ── State ────────────────────────────────────────────────────────────────
  let faceMesh      = null;
  let camera        = null;
  let videoEl       = null;
  let isRunning     = false;
  let isAttentive   = true;
  let inattentiveAt = null;   // timestamp when inattention began
  let alertFired    = false;  // prevent repeated alerts
  let onAlertCb     = null;   // callback: () => void
  let onReturnCb    = null;   // callback when child looks back

  let lastLandmarks = null;

  // ── Head-pose estimation ─────────────────────────────────────────────────
  // Uses key MediaPipe Face Mesh landmarks:
  //   1   = nose tip
  //   10  = forehead centre (top)
  //   152 = chin centre (bottom)
  //   234 = left cheek extreme
  //   454 = right cheek extreme
  function estimatePose(landmarks) {
    const noseTip  = landmarks[1];
    const faceLeft = landmarks[234];
    const faceRight= landmarks[454];
    const foreHead = landmarks[10];
    const chin     = landmarks[152];

    const faceWidth  = Math.abs(faceRight.x - faceLeft.x);
    const faceHeight = Math.abs(chin.y - foreHead.y);

    if (faceWidth < 0.01 || faceHeight < 0.01) return { yaw: 0, pitch: 0 }; // degenerate

    // Horizontal centre of face
    const centerX = (faceLeft.x + faceRight.x) / 2;
    // Vertical centre of face
    const centerY = (foreHead.y + chin.y) / 2;

    const yaw   = (noseTip.x - centerX) / faceWidth;   // negative = right turn
    const pitch = (noseTip.y - centerY) / faceHeight;   // positive = looking down

    return { yaw, pitch };
  }

  function isLookingAway(pose) {
    return Math.abs(pose.yaw) > YAW_LIMIT || Math.abs(pose.pitch) > PITCH_LIMIT;
  }

  // ── MediaPipe result handler ─────────────────────────────────────────────
  function onFaceMeshResults(results) {
    if (!isRunning) return;

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      // No face detected – treat as inattentive
      lastLandmarks = null;
      handleInattentive();
      return;
    }

    lastLandmarks = results.multiFaceLandmarks[0];
    const pose = estimatePose(lastLandmarks);

    if (isLookingAway(pose)) {
      handleInattentive();
    } else {
      handleAttentive();
    }
  }

  function handleInattentive() {
    const now = Date.now();
    if (isAttentive) {
      isAttentive   = false;
      inattentiveAt = now;
      alertFired    = false;
    }
    // Fire alert only once after threshold passes
    if (!alertFired && (now - inattentiveAt) >= INATTENTION_THRESHOLD_MS) {
      alertFired = true;
      if (onAlertCb) onAlertCb();
    }
  }

  function handleAttentive() {
    if (!isAttentive) {
      // Child just looked back
      isAttentive   = true;
      inattentiveAt = null;
      alertFired    = false;
      if (onReturnCb) onReturnCb();
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  async function init() {
    // Create hidden video element if not already present
    if (!videoEl) {
      videoEl = document.createElement("video");
      videoEl.id = "attention-video";
      videoEl.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;top:0;left:0;";
      videoEl.setAttribute("playsinline", "");
      document.body.appendChild(videoEl);
    }

    // Guard: if MediaPipe not loaded yet, bail gracefully
    if (typeof FaceMesh === "undefined") {
      console.warn("[Attention] MediaPipe FaceMesh not loaded. Attention detection disabled.");
      return false;
    }

    faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    faceMesh.onResults(onFaceMeshResults);

    // Use MediaPipe's Camera helper if available, otherwise raw getUserMedia
    if (typeof Camera !== "undefined") {
      camera = new Camera(videoEl, {
        onFrame: async () => {
          if (isRunning && faceMesh) {
            await faceMesh.send({ image: videoEl });
          }
        },
        width: 320,
        height: 240
      });
    } else {
      // Fallback: use getUserMedia + setInterval
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        videoEl.srcObject = stream;
        await videoEl.play();
        camera = {
          start: () => {
            camera._interval = setInterval(async () => {
              if (isRunning && faceMesh) {
                await faceMesh.send({ image: videoEl });
              }
            }, RECHECK_INTERVAL_MS);
          },
          stop: () => clearInterval(camera._interval)
        };
      } catch (err) {
        console.warn("[Attention] Camera access denied:", err.message);
        return false;
      }
    }

    console.log("[Attention] Initialized successfully.");
    return true;
  }

  function start(alertCallback, returnCallback) {
    if (!faceMesh) {
      console.warn("[Attention] Not initialized. Call init() first.");
      return;
    }
    onAlertCb  = alertCallback;
    onReturnCb = returnCallback;
    isRunning  = true;
    isAttentive = true;
    inattentiveAt = null;
    alertFired    = false;

    if (camera) camera.start();
    console.log("[Attention] Monitoring started.");
  }

  function stop() {
    isRunning = false;
    if (camera) camera.stop();
    console.log("[Attention] Monitoring stopped.");
  }

  function reset() {
    isAttentive   = true;
    inattentiveAt = null;
    alertFired    = false;
  }

  return { init, start, stop, reset };
})();
