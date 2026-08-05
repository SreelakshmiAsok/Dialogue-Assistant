// characters.js - Generates dynamic, animated SVGs for each character based on emotion and talking states

window.getCharacterSVG = function(characterId, emotion = "neutral", isTalking = false) {
  const talkingClass = isTalking ? "talking-mouth" : "";
  
  // Choose mouth path based on emotion and talking state
  let mouthPath = "";
  if (isTalking) {
    mouthPath = `M 110 135 Q 125 150 140 135 Q 125 155 110 135`;
  } else {
    switch (emotion) {
      case "happy":
      case "proud":
        mouthPath = `M 110 130 Q 125 148 140 130`; // Smile
        break;
      case "concerned":
        mouthPath = `M 115 138 Q 125 125 135 138`; // Frown
        break;
      case "neutral":
      default:
        mouthPath = `M 115 132 Q 125 140 135 132`; // Gentle smile
        break;
    }
  }

  // Choose eyebrow paths based on emotion
  let leftEyebrow = "M 95 85 Q 105 80 112 87";
  let rightEyebrow = "M 138 87 Q 145 80 155 85";
  if (emotion === "concerned") {
    leftEyebrow = "M 95 87 Q 105 90 112 83";
    rightEyebrow = "M 138 83 Q 145 90 155 87";
  } else if (emotion === "happy" || emotion === "proud") {
    leftEyebrow = "M 95 78 Q 105 73 112 80";
    rightEyebrow = "M 138 80 Q 145 73 155 78";
  }

  // Dynamic eye structures optimized per character to look humanized:
  let drawEyes = function(irisColor) {
    if (emotion === "happy" || emotion === "proud") {
      let l = `<path d="M 96 97 Q 105 86 114 97" stroke="#2d3748" stroke-width="4.5" stroke-linecap="round" fill="none" />`;
      let r = `<path d="M 136 97 Q 145 86 154 97" stroke="#2d3748" stroke-width="4.5" stroke-linecap="round" fill="none" />`;
      return { left: l, right: r };
    }
    
    // Concerned or neutral: human eyes with sclera, iris, pupil, reflex
    let l = `
      <ellipse cx="105" cy="95" rx="10" ry="7.5" fill="#ffffff" stroke="#2d3748" stroke-width="2.2" />
      <circle cx="105" cy="95" r="5" fill="${irisColor}" />
      <circle cx="105" cy="95" r="2.2" fill="#1e293b" />
      <circle cx="107.5" cy="92.5" r="1.2" fill="#ffffff" />
    `;
    let r = `
      <ellipse cx="145" cy="95" rx="10" ry="7.5" fill="#ffffff" stroke="#2d3748" stroke-width="2.2" />
      <circle cx="145" cy="95" r="5" fill="${irisColor}" />
      <circle cx="145" cy="95" r="2.2" fill="#1e293b" />
      <circle cx="147.5" cy="92.5" r="1.2" fill="#ffffff" />
    `;
    return { left: l, right: r };
  };

  // Core character drawings
  switch (characterId) {
    case "teacher": {
      return `
        <svg viewBox="0 0 250 250" class="character-svg teacher-color" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
          <image href="teacher_user.png" x="0" y="5" width="250" height="245" preserveAspectRatio="xMidYMax meet" />
        </svg>
      `;
    }

    case "parent": {
      return `
        <svg viewBox="0 0 250 250" class="character-svg parent-color" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
          <image href="dad_user.png" x="0" y="5" width="250" height="245" preserveAspectRatio="xMidYMax meet" />
        </svg>
      `;
    }

    case "friend": {
      return `
        <svg viewBox="0 0 250 250" class="character-svg friend-color" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
          <image href="friend_user.png" x="0" y="5" width="250" height="245" preserveAspectRatio="xMidYMax meet" />
        </svg>
      `;
    }

    case "stranger": {
      return `
        <svg viewBox="0 0 250 250" class="character-svg stranger-color" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
          <image href="stranger_perfect.png?v=20260726_perfect" x="0" y="5" width="250" height="245" preserveAspectRatio="xMidYMax meet" />
        </svg>
      `;
    }

    case "mascot": {
      let antennaPulse = "";
      if (isTalking) {
        antennaPulse = `<circle cx="125" cy="20" r="10" fill="#ecc94b" opacity="0.6" class="mascot-pulse" />`;
      }
      return `
        <svg viewBox="0 0 250 250" class="mascot-svg" xmlns="http://www.w3.org/2000/svg">
          <!-- Floating shadow -->
          <ellipse cx="125" cy="220" rx="35" ry="7" fill="rgba(0,0,0,0.12)" class="mascot-shadow-anim" />
          
          <!-- Floating Body Group -->
          <g class="mascot-float-anim">
            <!-- Antenna -->
            ${antennaPulse}
            <line x1="125" y1="50" x2="125" y2="25" stroke="#4a5568" stroke-width="5" />
            <circle cx="125" cy="25" r="6" fill="#ecc94b" />
            
            <!-- Ears / Side Attachments -->
            <rect x="58" y="90" width="12" height="30" rx="4" fill="#4a5568" />
            <rect x="180" y="90" width="12" height="30" rx="4" fill="#4a5568" />
            
            <!-- Head / Body (All in one robot display) -->
            <rect x="66" y="55" width="118" height="100" rx="28" fill="#3182ce" stroke="#2b6cb0" stroke-width="6" />
            
            <!-- Glass Screen face -->
            <rect x="76" y="65" width="98" height="65" rx="16" fill="#1a202c" stroke="#4a5568" stroke-width="3" />
            
            <!-- Robot Eyes (LED light bars or dots) -->
            ${emotion === "happy" || emotion === "proud" 
              ? `<path d="M 90 95 Q 100 85 110 95 M 140 95 Q 150 85 160 95" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" fill="none" />` 
              : emotion === "concerned"
                ? `<path d="M 90 90 L 105 100 M 160 90 L 145 100" stroke="#38bdf8" stroke-width="5" stroke-linecap="round" fill="none" />
                   <circle cx="98" cy="100" r="4" fill="#38bdf8" />
                   <circle cx="152" cy="100" r="4" fill="#38bdf8" />`
                : `<circle cx="100" cy="95" r="7" fill="#38bdf8" />
                   <circle cx="150" cy="95" r="7" fill="#38bdf8" />`
            }
            
            <!-- Mouth / Led Signal -->
            ${isTalking 
              ? `<path d="M 100 115 H 150" stroke="#48bb78" stroke-width="5" stroke-dasharray="4,2" stroke-linecap="round" />`
              : `<path d="M 110 118 Q 125 125 140 118" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" fill="none" />`
            }
            
            <!-- Jets / Thruster at bottom -->
            <path d="M 110 155 L 140 155 L 125 175 Z" fill="#e53e3e" />
            <path d="M 115 155 L 135 155 L 125 185 Z" fill="#dd6b20" class="mascot-fire-anim" />
          </g>
        </svg>
      `;
    }
    
    case "mascot-waving": {
      return `
        <svg viewBox="0 0 250 280" class="mascot-svg mascot-waving-svg" xmlns="http://www.w3.org/2000/svg">
          <!-- Floating shadow -->
          <ellipse cx="125" cy="240" rx="40" ry="9" fill="rgba(0,0,0,0.12)" class="mascot-shadow-anim" />

          <!-- Floating Body Group -->
          <g class="mascot-float-anim">
            <!-- Antenna (glowing during alert) -->
            <circle cx="125" cy="18" r="12" fill="#ecc94b" opacity="0.5" class="mascot-pulse" />
            <line x1="125" y1="55" x2="125" y2="22" stroke="#4a5568" stroke-width="5" />
            <circle cx="125" cy="22" r="7" fill="#ecc94b" />

            <!-- Side ears -->
            <rect x="56" y="92" width="12" height="30" rx="4" fill="#4a5568" />
            <rect x="182" y="92" width="12" height="30" rx="4" fill="#4a5568" />

            <!-- Body -->
            <rect x="66" y="58" width="118" height="100" rx="28" fill="#3182ce" stroke="#2b6cb0" stroke-width="6" />

            <!-- Screen face -->
            <rect x="76" y="68" width="98" height="65" rx="16" fill="#1a202c" stroke="#4a5568" stroke-width="3" />

            <!-- Happy eyes (curved upward arcs) -->
            <path d="M 90 98 Q 100 88 110 98 M 140 98 Q 150 88 160 98" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" fill="none" />

            <!-- Big smile mouth -->
            <path d="M 102 120 Q 125 132 148 120" stroke="#48bb78" stroke-width="5" stroke-linecap="round" fill="none" />

            <!-- LEFT arm (down, static) -->
            <rect x="46" y="100" width="20" height="50" rx="10" fill="#2b6cb0" />
            <circle cx="56" cy="155" r="10" fill="#2563eb" />

            <!-- RIGHT arm RAISED and WAVING (animated) -->
            <g class="mascot-wave-arm">
              <!-- Upper arm -->
              <rect x="184" y="80" width="20" height="45" rx="10" fill="#2b6cb0" transform="rotate(-45 194 80)" />
              <!-- Hand/fist waving -->
              <circle cx="210" cy="68" r="13" fill="#2563eb" />
              <!-- Little wave lines radiating from hand -->
              <path d="M 222 55 Q 232 48 228 40" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" fill="none" />
              <path d="M 226 62 Q 238 60 238 50" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" fill="none" />
            </g>

            <!-- Jets / Thruster -->
            <path d="M 110 158 L 140 158 L 125 178 Z" fill="#e53e3e" />
            <path d="M 115 158 L 135 158 L 125 192 Z" fill="#dd6b20" class="mascot-fire-anim" />
          </g>
        </svg>
      `;
    }
  }
}
