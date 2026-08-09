// attention.js - Real-time attention detection & Live Camera Feed using MediaPipe Face Mesh
// Tracks face presence & head pose via facial landmarks.
// Displays live webcam preview feed + landmark overlay canvas.
// If the child looks away or face is missing for > 5s, triggers gentle mascot wave + soft voice prompt.

window.AttentionSystem = (function () {

  // ── Config ────────────────────────────────────────────────────────────────
  const INATTENTION_THRESHOLD_MS = 5000;   // 5 s before alert fires
  const YAW_LIMIT   = 0.18;  // nose-drift ratio: >18% of face width = looking away L/R
  const PITCH_LIMIT = 0.20;  // nose-drift ratio: >20% of face height = looking up/down
  const RECHECK_INTERVAL_MS = 150;          // frequency to check landmarks

  // ── State ────────────────────────────────────────────────────────────────
  let faceMesh      = null;
  let camera        = null;
  let videoEl       = null;
  let canvasEl      = null;
  let canvasCtx     = null;
  let isRunning     = false;
  let isAttentive   = true;
  let inattentiveAt = null;   // timestamp when inattention began
  let alertFired    = false;  // prevent repeated alerts
  let onAlertCb     = null;   // callback: () => void
  let onReturnCb    = null;   // callback when child looks back
  let onStatusCb    = null;   // callback: (state: string, message: string, countdownSec: number) => void

  let lastLandmarks = null;
  let stream        = null;

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

    if (faceWidth < 0.01 || faceHeight < 0.01) return { yaw: 0, pitch: 0, faceWidth, faceHeight };

    // Horizontal centre of face
    const centerX = (faceLeft.x + faceRight.x) / 2;
    // Vertical centre of face
    const centerY = (foreHead.y + chin.y) / 2;

    const yaw   = (noseTip.x - centerX) / faceWidth;   // negative = right turn
    const pitch = (noseTip.y - centerY) / faceHeight;   // positive = looking down

    return { yaw, pitch, faceWidth, faceHeight, noseTip, centerX, centerY };
  }

  function isLookingAway(pose) {
    return Math.abs(pose.yaw) > YAW_LIMIT || Math.abs(pose.pitch) > PITCH_LIMIT;
  }

  // ── Canvas Overlay Drawing ────────────────────────────────────────────────
  function drawCanvasOverlay(landmarks, stateStr) {
    if (!canvasEl) canvasEl = document.getElementById("attention-canvas");
    if (!canvasEl) return;
    
    if (!canvasCtx) canvasCtx = canvasEl.getContext("2d");
    if (!canvasCtx) return;

    const width = canvasEl.width || 320;
    const height = canvasEl.height || 240;

    canvasCtx.clearRect(0, 0, width, height);

    if (!landmarks || landmarks.length === 0) {
      // Draw warning box when no face detected
      canvasCtx.strokeStyle = "rgba(239, 68, 68, 0.8)";
      canvasCtx.lineWidth = 3;
      canvasCtx.setLineDash([6, 6]);
      canvasCtx.strokeRect(10, 10, width - 20, height - 20);
      canvasCtx.setLineDash([]);
      return;
    }

    // Draw facial landmark points & gaze box
    const isOk = stateStr === "ATTENTIVE";
    canvasCtx.fillStyle = isOk ? "rgba(34, 197, 94, 0.8)" : "rgba(239, 68, 68, 0.9)";
    canvasCtx.strokeStyle = isOk ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)";
    canvasCtx.lineWidth = 2;

    // Draw key feature landmarks (eyes, nose, mouth boundary)
    const keyIndices = [1, 10, 152, 234, 454, 33, 263, 61, 291];
    keyIndices.forEach(idx => {
      const pt = landmarks[idx];
      if (pt) {
        canvasCtx.beginPath();
        canvasCtx.arc(pt.x * width, pt.y * height, 3, 0, 2 * Math.PI);
        canvasCtx.fill();
      }
    });

    // Draw face bounding box
    const faceLeft = landmarks[234];
    const faceRight = landmarks[454];
    const foreHead = landmarks[10];
    const chin = landmarks[152];

    if (faceLeft && faceRight && foreHead && chin) {
      const minX = Math.max(0, (faceLeft.x - 0.05) * width);
      const maxX = Math.min(width, (faceRight.x + 0.05) * width);
      const minY = Math.max(0, (foreHead.y - 0.05) * height);
      const maxY = Math.min(height, (chin.y + 0.05) * height);

      canvasCtx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }
  }

  // ── MediaPipe result handler ─────────────────────────────────────────────
  function onFaceMeshResults(results) {
    if (!isRunning) return;

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      // No face detected – treat as inattentive
      lastLandmarks = null;
      drawCanvasOverlay(null, "NO_FACE");
      handleInattentive("No face detected in camera");
      return;
    }

    lastLandmarks = results.multiFaceLandmarks[0];
    const pose = estimatePose(lastLandmarks);

    if (isLookingAway(pose)) {
      drawCanvasOverlay(lastLandmarks, "LOOKING_AWAY");
      handleInattentive("Looking away from screen");
    } else {
      drawCanvasOverlay(lastLandmarks, "ATTENTIVE");
      handleAttentive();
    }
  }

  function handleInattentive(reason) {
    const now = Date.now();
    if (isAttentive) {
      isAttentive   = false;
      inattentiveAt = now;
      alertFired    = false;
    }

    const elapsedMs = now - inattentiveAt;
    const remainingSec = Math.max(0, Math.ceil((INATTENTION_THRESHOLD_MS - elapsedMs) / 1000));

    if (onStatusCb) {
      const statusState = alertFired ? "DISTRACTED" : "INATTENTIVE";
      const statusMsg = alertFired 
        ? "🔴 Distracted — Alert Active"
        : `🟡 ${reason} (Alert in ${remainingSec}s)`;
      onStatusCb(statusState, statusMsg, remainingSec);
    }

    // Fire alert only once after threshold passes
    if (!alertFired && elapsedMs >= INATTENTION_THRESHOLD_MS) {
      alertFired = true;
      if (onAlertCb) onAlertCb();
    }
  }

  function handleAttentive() {
    if (!isAttentive || alertFired) {
      // Child just looked back
      isAttentive   = true;
      inattentiveAt = null;
      const wasAlerting = alertFired;
      alertFired    = false;

      if (onStatusCb) {
        onStatusCb("ATTENTIVE", "🟢 Focused & Engaged", 0);
      }
      if (wasAlerting && onReturnCb) {
        onReturnCb();
      }
    } else if (onStatusCb) {
      onStatusCb("ATTENTIVE", "🟢 Focused & Engaged", 0);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  async function init() {
    // Check if video element exists in DOM or create one
    videoEl = document.getElementById("attention-video");
    if (!videoEl) {
      videoEl = document.createElement("video");
      videoEl.id = "attention-video";
      videoEl.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;top:0;left:0;";
      videoEl.setAttribute("playsinline", "");
      videoEl.setAttribute("autoplay", "");
      videoEl.setAttribute("muted", "");
      document.body.appendChild(videoEl);
    }

    canvasEl = document.getElementById("attention-canvas");
    if (canvasEl) {
      canvasCtx = canvasEl.getContext("2d");
    }

    // Guard: if MediaPipe not loaded yet, bail gracefully
    if (typeof FaceMesh === "undefined") {
      console.warn("[Attention] MediaPipe FaceMesh not loaded. Attention detection disabled.");
      return false;
    }

    try {
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

      // Acquire media stream if needed
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" } 
        });
        videoEl.srcObject = stream;
        await videoEl.play().catch(() => {});
      } catch (e) {
        console.warn("[Attention] Could not access getUserMedia directly:", e.message);
      }

      // Use MediaPipe's Camera helper if available
      if (typeof Camera !== "undefined") {
        camera = new Camera(videoEl, {
          onFrame: async () => {
            if (isRunning && faceMesh && videoEl.readyState >= 2) {
              await faceMesh.send({ image: videoEl });
            }
          },
          width: 320,
          height: 240
        });
      } else {
        // Fallback: use setInterval to sample video frames
        camera = {
          start: () => {
            camera._interval = setInterval(async () => {
              if (isRunning && faceMesh && videoEl.readyState >= 2) {
                await faceMesh.send({ image: videoEl });
              }
            }, RECHECK_INTERVAL_MS);
          },
          stop: () => clearInterval(camera._interval)
        };
      }

      console.log("[Attention] Initialized successfully.");
      return true;
    } catch (err) {
      console.warn("[Attention] Initialization error:", err.message);
      return false;
    }
  }

  function start(alertCallback, returnCallback, statusCallback) {
    if (!faceMesh) {
      console.warn("[Attention] Not initialized. Attempting init...");
      init().then(ok => {
        if (ok) start(alertCallback, returnCallback, statusCallback);
      });
      return;
    }

    onAlertCb  = alertCallback;
    onReturnCb = returnCallback;
    onStatusCb = statusCallback;
    isRunning  = true;
    isAttentive = true;
    inattentiveAt = null;
    alertFired    = false;

    // Ensure video stream playing
    if (videoEl && videoEl.paused) {
      videoEl.play().catch(() => {});
    }

    if (camera) camera.start();
    console.log("[Attention] Monitoring started.");
  }

  function stop() {
    isRunning = false;
    if (camera) camera.stop();
    if (canvasCtx && canvasEl) {
      canvasCtx.clearRect(0, 0, canvasEl.width || 320, canvasEl.height || 240);
    }
    console.log("[Attention] Monitoring stopped.");
  }

  function reset() {
    isAttentive   = true;
    inattentiveAt = null;
    alertFired    = false;
  }

  return { init, start, stop, reset };
})();
