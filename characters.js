// characters.js - Generates dynamic, animated SVGs for each character based on emotion and talking states

window.getCharacterSVG = function(characterId, emotion = "neutral", isTalking = false) {
  const talkingClass = isTalking ? "talking-mouth" : "";
  
  // Choose mouth path based on emotion and talking state
  let mouthPath = "";
  if (isTalking) {
    // Talking animations will modify this path via CSS, but we provide a base open mouth
    mouthPath = `M 110 135 Q 125 150 140 135 Q 125 155 110 135`;
  } else {
    switch (emotion) {
      case "happy":
      case "proud":
        mouthPath = `M 110 130 Q 125 148 140 130`; // Deep smile
        break;
      case "concerned":
        mouthPath = `M 115 138 Q 125 125 135 138`; // Frown / Sad mouth
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
    leftEyebrow = "M 95 87 Q 105 90 112 83"; // Tilted up at inner ends
    rightEyebrow = "M 138 83 Q 145 90 155 87";
  } else if (emotion === "happy" || emotion === "proud") {
    leftEyebrow = "M 95 78 Q 105 73 112 80"; // Raised
    rightEyebrow = "M 138 80 Q 145 73 155 78";
  }

  // Choose eyes based on emotion
  let leftEye = `<circle cx="105" cy="95" r="6" fill="#2d3748" />`;
  let rightEye = `<circle cx="145" cy="95" r="6" fill="#2d3748" />`;
  if (emotion === "happy" || emotion === "proud") {
    // Joyful, curved closed eyes
    leftEye = `<path d="M 98 96 Q 105 88 112 96" stroke="#2d3748" stroke-width="4" stroke-linecap="round" fill="none" />`;
    rightEye = `<path d="M 138 96 Q 145 88 152 96" stroke="#2d3748" stroke-width="4" stroke-linecap="round" fill="none" />`;
  } else if (emotion === "concerned") {
    // Slightly wider or worried eyes
    leftEye = `<circle cx="105" cy="95" r="7" fill="#2d3748" />
               <circle cx="107" cy="93" r="2.5" fill="#fff" />`;
    rightEye = `<circle cx="145" cy="95" r="7" fill="#2d3748" />
                <circle cx="143" cy="93" r="2.5" fill="#fff" />`;
  }

  // Core character drawings
  switch (characterId) {
    case "teacher": // Ms. Apple
      return `
        <svg viewBox="0 0 250 250" class="character-svg teacher-color" xmlns="http://www.w3.org/2000/svg">
          <!-- Shadow -->
          <ellipse cx="125" cy="225" rx="60" ry="12" fill="rgba(0,0,0,0.15)" />
          
          <!-- Hair (Back Bun) -->
          <circle cx="125" cy="45" r="28" fill="#5c3d2e" />
          
          <!-- Body / Clothes -->
          <path d="M 65 220 C 75 170, 175 170, 185 220 Z" fill="#4a5568" />
          <!-- Collar -->
          <path d="M 105 180 L 125 195 L 145 180" stroke="#edf2f7" stroke-width="4" fill="none" />
          <!-- Red Apple pin -->
          <circle cx="160" cy="200" r="6" fill="#e53e3e" />
          <path d="M 160 194 Q 163 190 162 188" stroke="#48bb78" stroke-width="2" fill="none" />
          
          <!-- Neck -->
          <rect x="113" y="160" width="24" height="25" rx="5" fill="#ffd0b0" />
          
          <!-- Face -->
          <circle cx="125" cy="115" r="50" fill="#ffd0b0" />
          
          <!-- Ears -->
          <circle cx="72" cy="115" r="10" fill="#ffd0b0" />
          <circle cx="178" cy="115" r="10" fill="#ffd0b0" />
          
          <!-- Hair (Front / Bangs) -->
          <path d="M 75 100 C 85 60, 165 60, 175 100 C 160 75, 90 75, 75 100 Z" fill="#704f3f" />
          
          <!-- Glasses -->
          <circle cx="105" cy="95" r="16" stroke="#e53e3e" stroke-width="4" fill="none" />
          <circle cx="145" cy="95" r="16" stroke="#e53e3e" stroke-width="4" fill="none" />
          <path d="M 121 95 L 129 95" stroke="#e53e3e" stroke-width="4" />
          <path d="M 89 95 L 77 95" stroke="#e53e3e" stroke-width="3" />
          <path d="M 161 95 L 173 95" stroke="#e53e3e" stroke-width="3" />
          
          <!-- Eyes (rendered behind glasses, but SVG layers are ordered) -->
          <g>
            ${leftEye}
            ${rightEye}
          </g>
          
          <!-- Eyebrows -->
          <path d="${leftEyebrow}" stroke="#5c3d2e" stroke-width="4" stroke-linecap="round" fill="none" />
          <path d="${rightEyebrow}" stroke="#5c3d2e" stroke-width="4" stroke-linecap="round" fill="none" />
          
          <!-- Nose -->
          <path d="M 122 112 Q 125 118 128 112" stroke="#e2a784" stroke-width="3" stroke-linecap="round" fill="none" />
          
          <!-- Mouth -->
          <path d="${mouthPath}" class="${talkingClass}" stroke="#c53030" stroke-width="4" stroke-linecap="round" fill="#e53e3e" />
        </svg>
      `;

    case "parent": // Dad
      return `
        <svg viewBox="0 0 250 250" class="character-svg parent-color" xmlns="http://www.w3.org/2000/svg">
          <!-- Shadow -->
          <ellipse cx="125" cy="225" rx="60" ry="12" fill="rgba(0,0,0,0.15)" />
          
          <!-- Body / Clothes -->
          <path d="M 65 220 C 75 170, 175 170, 185 220 Z" fill="#2b6cb0" />
          <!-- V-Neck Shirt -->
          <path d="M 110 180 L 125 200 L 140 180 Z" fill="#e2e8f0" />
          <path d="M 105 180 L 125 202 L 145 180" stroke="#1a365d" stroke-width="3" fill="none" />
          
          <!-- Neck -->
          <rect x="113" y="160" width="24" height="25" rx="5" fill="#fbd38d" />
          
          <!-- Face -->
          <circle cx="125" cy="115" r="50" fill="#fbd38d" />
          
          <!-- Beard / Stubble -->
          <path d="M 75 115 C 75 160, 175 160, 175 115 C 175 145, 75 145, 75 115 Z" fill="#4a5568" opacity="0.35" />
          <path d="M 80 125 Q 125 165 170 125 Q 175 155 125 165 Q 75 155 80 125 Z" fill="#2d3748" />
          
          <!-- Hair (Brown Short Side-Part) -->
          <path d="M 74 105 C 70 85, 80 50, 125 50 C 160 50, 175 75, 175 105 C 171 95, 165 92, 160 92 C 145 92, 125 75, 100 85 C 85 92, 78 95, 74 105 Z" fill="#5c3d2e" />
          
          <!-- Eyes -->
          <g>
            ${leftEye}
            ${rightEye}
          </g>
          
          <!-- Eyebrows -->
          <path d="${leftEyebrow}" stroke="#2d3748" stroke-width="4" stroke-linecap="round" fill="none" />
          <path d="${rightEyebrow}" stroke="#2d3748" stroke-width="4" stroke-linecap="round" fill="none" />
          
          <!-- Nose -->
          <path d="M 121 110 Q 125 116 129 110" stroke="#dd6b20" stroke-width="3" stroke-linecap="round" fill="none" />
          
          <!-- Mouth -->
          <path d="${mouthPath}" class="${talkingClass}" stroke="#c53030" stroke-width="4" stroke-linecap="round" fill="#e53e3e" />
        </svg>
      `;

    case "friend": // Leo
      return `
        <svg viewBox="0 0 250 250" class="character-svg friend-color" xmlns="http://www.w3.org/2000/svg">
          <!-- Shadow -->
          <ellipse cx="125" cy="225" rx="60" ry="12" fill="rgba(0,0,0,0.15)" />
          
          <!-- Body / Clothes (Striped Orange Shirt) -->
          <path d="M 65 220 C 75 170, 175 170, 185 220 Z" fill="#dd6b20" />
          <path d="M 82 188 Q 125 178 168 188" stroke="#fff" stroke-width="12" fill="none" />
          <path d="M 75 208 Q 125 198 175 208" stroke="#fff" stroke-width="12" fill="none" />
          
          <!-- Neck -->
          <rect x="114" y="160" width="22" height="25" rx="4" fill="#feebc8" />
          
          <!-- Face -->
          <circle cx="125" cy="115" r="48" fill="#feebc8" />
          
          <!-- Freckles -->
          <circle cx="95" cy="118" r="1.5" fill="#dd6b20" opacity="0.6" />
          <circle cx="98" cy="122" r="1.5" fill="#dd6b20" opacity="0.6" />
          <circle cx="102" cy="119" r="1.5" fill="#dd6b20" opacity="0.6" />
          
          <circle cx="155" cy="118" r="1.5" fill="#dd6b20" opacity="0.6" />
          <circle cx="152" cy="122" r="1.5" fill="#dd6b20" opacity="0.6" />
          <circle cx="148" cy="119" r="1.5" fill="#dd6b20" opacity="0.6" />
          
          <!-- Messy Orange Hair -->
          <path d="M 72 108 C 65 90, 75 40, 120 40 C 160 40, 180 80, 178 108 C 172 90, 155 75, 140 80 C 125 70, 110 65, 95 80 C 85 75, 78 90, 72 108 Z" fill="#ed8936" />
          <!-- Hair bangs pointing down -->
          <path d="M 90 78 L 98 90 L 105 80 L 115 93 L 122 81 L 132 92 L 140 80" stroke="#ed8936" stroke-width="4" stroke-linejoin="round" fill="#ed8936" />
          
          <!-- Eyes -->
          <g>
            ${leftEye}
            ${rightEye}
          </g>
          
          <!-- Eyebrows -->
          <path d="${leftEyebrow}" stroke="#c05621" stroke-width="4" stroke-linecap="round" fill="none" />
          <path d="${rightEyebrow}" stroke="#c05621" stroke-width="4" stroke-linecap="round" fill="none" />
          
          <!-- Nose -->
          <ellipse cx="125" cy="111" rx="4" ry="2.5" fill="#fbd38d" />
          
          <!-- Mouth -->
          <path d="${mouthPath}" class="${talkingClass}" stroke="#c53030" stroke-width="4" stroke-linecap="round" fill="#e53e3e" />
        </svg>
      `;

    case "stranger": // Mr. Green
      // For stranger, concerned/neutral = neutral looking stranger with green hat.
      // Happy = over-friendly grin.
      // Concerned = sweat drop + startled look.
      let sweatDrop = "";
      if (emotion === "concerned") {
        sweatDrop = `<path d="M 180 75 Q 185 85 180 90 Q 175 85 180 75" fill="#63b3ed" />`;
      }
      return `
        <svg viewBox="0 0 250 250" class="character-svg stranger-color" xmlns="http://www.w3.org/2000/svg">
          <!-- Shadow -->
          <ellipse cx="125" cy="225" rx="60" ry="12" fill="rgba(0,0,0,0.15)" />
          
          <!-- Body / Clothes (Dark Green Jacket) -->
          <path d="M 65 220 C 75 165, 175 165, 185 220 Z" fill="#22543d" />
          <!-- Collar of coat -->
          <path d="M 90 180 L 125 210 L 160 180" stroke="#276749" stroke-width="8" fill="none" stroke-linejoin="round" />
          <!-- Yellow neck scarf -->
          <path d="M 110 180 Q 125 190 140 180 L 125 215 Z" fill="#ecc94b" />
          
          <!-- Neck -->
          <rect x="114" y="160" width="22" height="25" rx="4" fill="#eed0b5" />
          
          <!-- Face -->
          <circle cx="125" cy="115" r="48" fill="#eed0b5" />
          
          <!-- Mysterious Sunglasses / Specs (Optional, let's keep friendly but slightly shady) -->
          <!-- We'll give him a slightly larger nose and a green flat cap -->
          
          <!-- Flat Cap (Green) -->
          <!-- Cap base -->
          <ellipse cx="125" cy="65" rx="45" ry="18" fill="#2f855a" />
          <!-- Cap visor -->
          <path d="M 80 68 C 80 68, 125 82, 170 68 C 160 55, 90 55, 80 68 Z" fill="#276749" />
          
          <!-- Eyes -->
          <g>
            ${leftEye}
            ${rightEye}
          </g>
          
          <!-- Eyebrows -->
          <path d="${leftEyebrow}" stroke="#1a202c" stroke-width="4" stroke-linecap="round" fill="none" />
          <path d="${rightEyebrow}" stroke="#1a202c" stroke-width="4" stroke-linecap="round" fill="none" />
          
          <!-- Nose (Larger/different shape) -->
          <path d="M 121 106 Q 125 118 130 110" stroke="#d69e2e" stroke-width="3" stroke-linecap="round" fill="none" />
          
          <!-- Mouth -->
          <path d="${mouthPath}" class="${talkingClass}" stroke="#742a2a" stroke-width="4" stroke-linecap="round" fill="#9b2c2c" />
          
          <!-- Sweating drop for concerned stranger -->
          ${sweatDrop}
        </svg>
      `;
      
    case "mascot": // Buddy the robot mascot (floating UI helper)
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
}
