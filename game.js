//Music
const ambient = new Audio("music/eyes_in_the_shadows_loop.flac");
const sonar = new Audio("music/submarine-sonar-fx.wav");
const explosion = new Audio("music/NenadSimic - Muffled Distant Explosion.wav")
const d_boom = new Audio("music/DeathFlash.flac")
const thend = new Audio("music/Night-Vigil.mp3")

ambient.loop = true;
ambient.volume = 0.5;
sonar.volume = 0.3;
sonar.loop = true;
explosion.volume = 0.5;
d_boom.volume = 0.5;
thend.loop = true;
thend.volume = 0.5;


function startSounds() {
  if (isPaused || isGameOver) return; // prevent sound if game is paused or over
  ambient.play();
  sonar.play(); // Could also be triggered on an event or timer
}

function endSounds() {
  ambient.pause();
  ambient.currentTime = 0;

  sonar.pause(); // Could also be triggered on an event or timer
  sonar.currentTime = 0;

}

function pauseSounds() {
  ambient.pause();
  sonar.pause(); // Could also be triggered on an event or timer

}

function endGamesound(){
  playSegment(thend,1,288)
}

function playSegment(audio, startTime, endTime) {
  audio.currentTime = startTime;
  audio.play();

  const duration = (endTime - startTime) * 1000;
  setTimeout(() => {
    audio.pause();
  }, duration);
}



//air variables
let maxAir = 100;         // Max air level
let currentAir = maxAir;  // Current air supply
let airDepletionRate = 0.2;  // Air loss per frame
let airRefillRate = 0.5;     // Refill per frame at surface
let isSurfaced = true;      // Whether submarine is surfaced
let forcedSurfacing = false; // If surfacing was forced due to 0 air



//pause button
let isPaused = false;

let gameRunning = true;

let isGameOver = false;

//variable for noise depth
const NOISE_DEPTH_THRESHOLD = 35; // meters; adjust as needed
const SURFACE_NOISE_RADIUS = 50;  // fixed noise radius if too shallow
const ESCAPE_DEPTH = 225;  // e.g., must dive below 200m to lose enemies

//Variables for crush depth
const CRUSH_DEPTH = 250;        // e.g., below 400m starts taking damage
const CRUSH_DAMAGE_RATE = 10;   // health lost per second


//wave variable
let waveOffset = 0;


//day and night cycle values

let brightness = 1;
const DAY_LENGTH = 120; // seconds for full day-night cycle
let dayNightTime = DAY_LENGTH * 1.5;  // keeps track of elapsed time



//score
let killCount = 0;

//player's depth
let playerDepth = 0;           // in meters or arbitrary units
const MAX_DEPTH = 500;         // maximum submarine depth
const MIN_DEPTH = 0;           // surface level
const ALT_NOISE_DEPTH = 5;
const DEPTH_STEP = 2;          // depth change per key press

//Image of the uboat
const uboatImage = new Image();
uboatImage.src = 'small_uboat_2.png';


//image of pause/play button
const play_button = new Image();
play_button.src = 'play.png';


//torpedoes
const torpedoes = [];
let lastTorpedoTime = 0;
let TORPEDO_COOLDOWN = 500; // ms


//depth canvas
const depthCanvas = document.getElementById('depthCanvas');
const dctx = depthCanvas.getContext('2d');

//Radar screen: 
const canvas = document.getElementById('radar');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 300;

const radarBackground = new Image();
radarBackground.src = 'bathy_image.png';  // Your image file path

//Radar screen sweep pulser
let radarSweepAngle = 0; // radians
const radarSweepSpeed = 0.02; // radians per frame






//other radar screen to tell your where other enemies are: 
const minimap = document.getElementById('minimap');
const mctx = minimap.getContext('2d');
const minimapSize = 100; // pixel size


const MAP_SIZE = 3000;
let playerHealth = 100;
let animationFrameId; // store the loop id globally


let shipX = MAP_SIZE / 2;
let shipY = MAP_SIZE / 2;
let shipAngle = 0;
let velocity = 0;
let velocityX = 0;
let velocityY = 0;

const MAX_FORWARD_SPEED = 3;                            //<---------- max speed for your ship
const MAX_REVERSE_SPEED = -1.5;
const ACCELERATION = 0.05;
const RUDDER_ACC = 0.02;
const TURN_SPEED = 0.03;
const DRAG = 0.98;

// Rudder
let rudderAngle = 0;
let rudderTarget = 0;
const RUDDER_RATE = 0.02;

// Input
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

//fire torpedoes:
window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  keys[key] = true;

  if (key === ' ' && Date.now() - lastTorpedoTime > TORPEDO_COOLDOWN) {
    if (playerDepth < NOISE_DEPTH_THRESHOLD) {
      // Allowed to fire torpedo
      torpedoes.push({
        x: shipX,
        y: shipY,
        angle: shipAngle,
        speed: 5,
        life: 2000, // 2 seconds lifetime
        spawnTime: Date.now(),
        firedBy: 'player'
      });
      lastTorpedoTime = Date.now();
    } else {
      // Optional: feedback for player
      console.log("🚫 Torpedo launch blocked: too deep!");
    }
  }
});


//Torpedoe update
function updateTorpedoes() {
  const now = Date.now();
  for (let i = torpedoes.length - 1; i >= 0; i--) {
    const t = torpedoes[i];
    t.x += Math.sin(t.angle) * t.speed;
    t.y += -Math.cos(t.angle) * t.speed;

    // Check for expiration
    if (now - t.spawnTime > t.life) {
      torpedoes.splice(i, 1);
      continue;
    }

    // Check collision with enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const dx = t.x - e.x;
      const dy = t.y - e.y;
      if (Math.sqrt(dx * dx + dy * dy) < 10) {
        enemies.splice(j, 1);
        enemies.push({
          x: Math.random() * MAP_SIZE,
          y: Math.random() * MAP_SIZE,
          state: 'idle',
          lastKnownX: null,
          lastKnownY: null,
          angle: Math.random() * Math.PI * 2,
          speed: 2.5,
          lastAttackTime: 0
        });

        torpedoes.splice(i, 1);
        playSegment(explosion,0,1);
        killCount++; //                     <------ increase kill count
        airRefillRate + (killCount * 0.05);
        TORPEDO_COOLDOWN = TORPEDO_COOLDOWN - 2.5;
        console.log("Refilling air:", airRefillRate);
        break;
      }
    }
  }
}

//Draw torpedoes
function drawTorpedoes() {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-shipAngle);
  ctx.fillStyle = 'cyan';

  torpedoes.forEach(t => {
    const dx = t.x - shipX;
    const dy = t.y - shipY;
    ctx.beginPath();
    ctx.arc(dx, dy, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}



// Mines
const NUM_MINES = 300;
const mines = Array.from({ length: NUM_MINES }, () => ({
  x: Math.random() * MAP_SIZE,
  y: Math.random() * MAP_SIZE
}));

// Enemies
const NUM_ENEMIES = 80; //                                    <-----------here is the set number of enemies
const enemies = Array.from({ length: NUM_ENEMIES }, () => ({
  x: Math.random() * MAP_SIZE,
  y: Math.random() * MAP_SIZE,
  state: 'idle',
  lastKnownX: null,
  lastKnownY: null,
  angle: Math.random() * Math.PI * 2,
  speed: 2.5,                                               //<-----this updates enemy speed
  lastAttackTime: 0 // for attack cooldown
}));

/**/
function updateShip() {

    if (keys['a']) rudderTarget = -1,velocity += RUDDER_ACC;
    else if (keys['d']) rudderTarget = 1,velocity += RUDDER_ACC;
    else rudderTarget = 0;

    // Smooth rudder control
    if (rudderAngle < rudderTarget) {
        rudderAngle += RUDDER_RATE;
        if (rudderAngle > rudderTarget) rudderAngle = rudderTarget;
    } else if (rudderAngle > rudderTarget) {
        rudderAngle -= RUDDER_RATE;
        if (rudderAngle < rudderTarget) rudderAngle = rudderTarget;
    }

    if (Math.abs(velocity) > 0.01) {
    // Moving: turn faster
    shipAngle += rudderAngle * TURN_SPEED;
    } else if (rudderAngle !== 0) {
    // Not moving: turn slower
    shipAngle += rudderAngle * (TURN_SPEED * 0.4); // 40% of normal speed
    }

    if (keys['w']) {
        velocity += ACCELERATION;
        if (velocity > MAX_FORWARD_SPEED) velocity = MAX_FORWARD_SPEED;
    } else if (keys['s']) {
        velocity -= ACCELERATION;
        if (velocity < MAX_REVERSE_SPEED) velocity = MAX_REVERSE_SPEED;
    } else {
        velocity *= DRAG;
        if (Math.abs(velocity) < 0.01) velocity = 0;
    }

    //This is for depth control
    if (keys['q'] && !forcedSurfacing) {
    playerDepth -= DEPTH_STEP * 0.5;
    if (playerDepth < MIN_DEPTH) playerDepth = MIN_DEPTH;
    }
    if (keys['e'] && !forcedSurfacing) {
    playerDepth += DEPTH_STEP * 2.25;
    if (playerDepth > MAX_DEPTH) playerDepth = MAX_DEPTH;
    }
    //forced surfacing
    if (forcedSurfacing == true) {
    playerDepth -= DEPTH_STEP * 0.5;
    if (playerDepth < MIN_DEPTH) playerDepth = MIN_DEPTH;
    } 
    






    // Check for crush depth damage
    if (playerDepth > CRUSH_DEPTH) {
      const damagePerFrame = (CRUSH_DAMAGE_RATE / 60); // damage per frame @ 60fps
      playerHealth -= damagePerFrame;
      console.log(`Crush: playerHealth=${playerHealth.toFixed(3)}`); // 👈 add this

      if  (playerHealth < 0 && !isGameOver)  {
        
        isGameOver = true; // Prevent repeat
        //
        playerHealth = 0; // cap health at 0
        updateHealthBar(); // update visual bar
        gameRunning = false;  // ⬅️ This prevents further loop frames
        console.log('Calling cancelAnimationFrame with ID:', animationFrameId);
        cancelAnimationFrame(animationFrameId); // stop the game loop if you store it

        console.log('Player died: showing replay button');
        //stop game sounds and que endgame music
        endSounds();
        endGamesound();
        document.getElementById('gameOverOverlay').style.display = 'flex';
        document.getElementById('replayButton').style.display = 'block';

        //high score:
          saveScore(killCount);   // 🟢 save score on death
          showHighScores();       // 🟢 show the scoreboard

        return; 

      }

    }

    //Regeneration:




    velocityX = Math.sin(shipAngle) * velocity;
    velocityY = -Math.cos(shipAngle) * velocity;

    shipX += velocityX;
    shipY += velocityY;

    let deg = shipAngle * 180 / Math.PI;
    if (deg < 0) deg += 360;
    document.getElementById('compass').textContent =
        //`Position: (${Math.floor(shipX)}, ${Math.floor(shipY)}), Heading: ${deg.toFixed(1)}°, Speed: ${velocity.toFixed(2)}, Rudder: ${rudderAngle.toFixed(2)}`;
        `Heading: ${deg.toFixed(1)}°\t\t\t\t\t\t\t\t\tSpeed: ${velocity.toFixed(2)}`;


    // Wrap player ship around the map edges
    shipX = (shipX + MAP_SIZE) % MAP_SIZE;
    shipY = (shipY + MAP_SIZE) % MAP_SIZE;

  }


  //air
  function updateAir() {
  if (isSurfaced && playerDepth == 0) {
    currentAir = Math.min(maxAir, currentAir + airRefillRate);
    //if (forcedSurfacing && currentAir >= maxAir) {
    if (forcedSurfacing ) {
      forcedSurfacing = false;
      // Allow diving again
    }
  } else {
    currentAir -= airDepletionRate;
    if (currentAir <= 0 && !forcedSurfacing) {
      currentAir = 0;
      forcedSurfacing = true;
      isSurfaced = true; // force surfacing
    }
  }
  //airRefillRate = airRefillRate + (killCount * 0.1);
  console.log("Refilling air:", airRefillRate);
}


  
function updateScoreboard() {
  const tallyPerCross = 10;          // 10 kills per white ✠
  const crossesPerRed = 10;          // 10 white ✠ per red ✠
  const killsPerRed = tallyPerCross * crossesPerRed; // 10 * 10 = 100
 
  const redCrosses = Math.floor(killCount / killsPerRed);
  const whiteCrosses = Math.floor((killCount % killsPerRed) / tallyPerCross);
  const tallies = killCount % tallyPerCross;

  let scoreText = '';

  for (let i = 0; i < redCrosses; i++) {
    scoreText += '<span style="color: red;"> ✠ </span>';
  }

  for (let i = 0; i < whiteCrosses; i++) {
    scoreText += '<span style="color: white;"> ✠ </span>';
  }

  for (let i = 0; i < tallies; i++) {
    scoreText += '<span style="color: white;"> | </span>';
  }

  document.getElementById('scoreboard').innerHTML = `Kills: ${scoreText}`;


  //Health regeneration
  
}





function drawRadar() {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.strokeStyle = 'rgb(0, 77, 0)'; //change the color of the radar grid here
    
    ctx.lineWidth = 1;
    for (let r = 100; r <= radius; r += 100) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
/*
function drawRadar() {
  ctx.save();

  // Draw radar background image centered
  const bgSize = radius * 2; // diameter of radar
  const bgX = centerX - radius;
  const bgY = centerY - radius;
  ctx.drawImage(radarBackground, bgX, bgY, bgSize, bgSize);

  // Draw grid on top of the image
  ctx.translate(centerX, centerY);
  ctx.strokeStyle = 'rgb(0, 77, 0)';
  ctx.lineWidth = 1;
  for (let r = 100; r <= radius; r += 100) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}*/


function drawRadarSweep() {
  ctx.save();
  ctx.translate(centerX, centerY);

  // Draw the sweep line                                  ?
  ctx.strokeStyle = 'lime';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.sin(radarSweepAngle) * centerX, -Math.cos(radarSweepAngle) * centerY);
  ctx.stroke();

  ctx.restore();
}

//Here is where you draw the minimap
function drawMinimap() {
  mctx.clearRect(0, 0, minimap.width, minimap.height);

  // Draw map border
  mctx.strokeStyle = 'lime';
  mctx.strokeRect(0, 0, minimapSize, minimapSize);

  // Scale factor: MAP_SIZE → minimapSize
  const scale = minimapSize / MAP_SIZE;

  // Draw player ship
  /*
  mctx.fillStyle = 'rgb(0, 225, 255)';
  mctx.beginPath();
  mctx.arc(shipX * scale, shipY * scale, 3, 0, Math.PI * 2);
  mctx.fill();*/
  // Draw player ship as an arrow
  const shipMinimapX = shipX * scale;
  const shipMinimapY = shipY * scale;

  mctx.save();
  mctx.translate(shipMinimapX, shipMinimapY);
  mctx.rotate(shipAngle); // rotate to ship's heading
  mctx.fillStyle = 'lime';

  mctx.beginPath();
  mctx.moveTo(0, -5);  // arrow tip
  mctx.lineTo(3, 5);   // right corner
  mctx.lineTo(-3, 5);  // left corner
  mctx.closePath();
  mctx.fill();
  mctx.restore();


  // Draw enemies
  enemies.forEach(e => {
    mctx.fillStyle =
      e.state === 'tracking' ? 'red' :
      e.state === 'searching' ? 'orange' : 'gray';

    mctx.beginPath();
    mctx.arc(e.x * scale, e.y * scale, 3, 0, Math.PI * 2);
    mctx.fill();
  });
}

function drawDepthGauge() {
  // Where along the top (x-axis) should sun/moon be?
  //const sunMoonX = depthCanvas.width * dayProgress;
  




  dctx.clearRect(0, 0, depthCanvas.width, depthCanvas.height);

  // Draw gradient background as before
  const gradient = dctx.createLinearGradient(0, 0, 0, depthCanvas.height);
  gradient.addColorStop(0, '#00bfff');
  gradient.addColorStop(1, '#000033');
  dctx.fillStyle = gradient;
  dctx.fillRect(0, 0, depthCanvas.width, depthCanvas.height);





  

  // Draw wavy surface line at waveY
  const waveY = depthCanvas.height * 0.1;
  const waveAmplitude = 4;
  const waveFrequency = 0.2;




  // Calculate marker position: 0m → waveY, MAX_DEPTH → depthCanvas.height
  const gaugeHeight = depthCanvas.height - waveY; // distance from wave to bottom
  const depthRatio = playerDepth / MAX_DEPTH;
  const markerY = waveY + (depthRatio * gaugeHeight);

  // Draw current depth marker <--------------This is where you want to draw a submarine






  //                                 <----------------------Show numeric depth
  //dctx.fillStyle = 'white';
  //dctx.font = '16px monospace';
  //dctx.textAlign = 'center';
  //dctx.fillText(`${playerDepth.toFixed(0)}m`, depthCanvas.width / 2, markerY - 10);

  // Escape depth marker
  const escapeRatio = ESCAPE_DEPTH / MAX_DEPTH;
  const escapeY = waveY + (escapeRatio * gaugeHeight);

  dctx.strokeStyle = 'rgb(255, 154, 2)';
  dctx.lineWidth = 3;
  dctx.beginPath();
  dctx.moveTo(0, escapeY);
  dctx.lineTo(depthCanvas.width, escapeY);
  dctx.stroke();

  dctx.fillStyle = 'lime';
  dctx.font = '12px monospace';
  dctx.textAlign = 'left';
  dctx.fillText(`Escape Depth `, 5, escapeY + 15);

  // Firing depth marker
  const firingRatio = NOISE_DEPTH_THRESHOLD / MAX_DEPTH;
  const firingY = waveY + (firingRatio * gaugeHeight);

  dctx.strokeStyle = 'yellow';
  dctx.lineWidth = 3;
  dctx.beginPath();
  dctx.moveTo(0, firingY);
  dctx.lineTo(depthCanvas.width, firingY);
  dctx.stroke();

  dctx.fillStyle = 'yellow';
  dctx.font = '12px monospace';
  //dctx.fillText(`Firing Depth (${NOISE_DEPTH_THRESHOLD}m)`, 5, firingY - 5);
  dctx.fillText(`Firing Depth ↑`, 5, firingY - 5);

  // Draw crush depth marker
  const crushRatio = CRUSH_DEPTH / MAX_DEPTH;
  const crushY = waveY + (crushRatio * gaugeHeight);

  dctx.strokeStyle = 'red';
  dctx.lineWidth = 3;
  dctx.beginPath();
  dctx.moveTo(0, crushY);
  dctx.lineTo(depthCanvas.width, crushY);
  dctx.stroke();

  dctx.fillStyle = 'lime';
  dctx.font = '14px monospace';
  dctx.fillText(`Crush Depth!`, 5, crushY + 15);

    // Draw main body
    dctx.save();
    dctx.translate(depthCanvas.width / 2, markerY);
    dctx.drawImage(uboatImage, -50, -37, 96, 69); // draw centered
    dctx.restore();






  // Compute night darkness: 0 (day) → 1 (night)
  const darkness = 1 - brightness;
  const globalWaveOffset = Math.sin(waveOffset) * waveAmplitude; // consistent global bobbing

  // Draw dark overlay at night (night sky)
  dctx.save();
  dctx.fillStyle = `rgba(0, 0, 30, ${darkness * 0.7})`; // dark night sky
  dctx.beginPath();
  dctx.moveTo(0, 0); // top-left corner
  dctx.lineTo(0, waveY + Math.sin(0 * waveFrequency + waveOffset) * waveAmplitude); // down to first wave point

// Trace wave curve
for (let x = 0; x <= depthCanvas.width; x++) {
  const yOffset = Math.sin((x * waveFrequency) + waveOffset) * waveAmplitude;
  dctx.lineTo(x, waveY + yOffset);
}

dctx.lineTo(depthCanvas.width, 0); // top-right corner
dctx.closePath();
dctx.fill();
  //waves
  dctx.strokeStyle = 'white';
  dctx.lineWidth = 2;
  dctx.beginPath();
  for (let x = 0; x <= depthCanvas.width; x++) {
    const yOffset = Math.sin((x * waveFrequency) + waveOffset) * waveAmplitude;

    if (x === 0) dctx.moveTo(x, waveY + yOffset);
    else dctx.lineTo(x, waveY + yOffset);
  }
  dctx.stroke();


  // Sun & Moon cycle on surface
  const dayProgress = dayNightTime / DAY_LENGTH;
  const sunMoonX = depthCanvas.width * dayProgress;


  


  // Draw Moon (opposite position)
  const moonX = depthCanvas.width * ((dayProgress + 0.35) % 1);
  dctx.globalAlpha = darkness; // moon fully visible at night, fades out as day breaks
  dctx.beginPath();
  dctx.fillStyle = 'lightgray';
  dctx.arc(sunMoonX, waveY - 40, 6, 0, Math.PI * 2);

  dctx.fill();
  dctx.globalAlpha = 1; // reset alpha after drawing
   
  // Draw Sun
  //dctx.beginPath();
  //dctx.fillStyle = 'yellow';
  //dctx.arc(moonX, waveY - 40, 8, 0, Math.PI * 2);
  
  //dddctx.fill();




}




function drawEnemies() {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-shipAngle);

  enemies.forEach(enemy => {
    const dx = enemy.x - shipX;
    const dy = enemy.y - shipY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius + 50) {
      ctx.beginPath();
      ctx.fillStyle =
        enemy.state === 'tracking' ? 'red' :
        enemy.state === 'searching' ? 'orange' : 'lime';
      ctx.arc(dx, dy, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.restore();
}

function drawShip() { 
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.beginPath();
  ctx.moveTo(0, -30);    // Top
  ctx.lineTo(6, 0);     // Right
  ctx.lineTo(0, 30);     // Bottom
  ctx.lineTo(-6, 0);    // Left
  ctx.closePath();       // Connect back to Top
  ctx.fillStyle = 'rgb(97, 231, 255)';
  ctx.fill();
  ctx.restore();
}


function drawNoiseRing() {
  const noiseRadius = calculateNoiseRadius(); // get real current radius

  const pixelsPerMapUnit = centerX / radius; // your radar scale factor
  const visualRadius = noiseRadius * pixelsPerMapUnit;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.beginPath();
  ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}


//keeping track of the highest score
function saveScore(newScore) {
  const scores = JSON.parse(localStorage.getItem('highScores')) || [];

  const playerName = prompt("Enter your name for the scoreboard:") || "Anonymous";

  scores.push({ name: playerName, score: newScore });

  scores.sort((a, b) => b.score - a.score);           // sort by score descending
  const topScores = scores.slice(0, 5);               // keep only top 5

  localStorage.setItem('highScores', JSON.stringify(topScores));
  
}




function showHighScores() {
  const highScores = JSON.parse(localStorage.getItem('highScores')) || [];

  // In-game high scores list
  const gameList = document.getElementById('highScoresList');
  if (gameList) {
    gameList.innerHTML = '<h3>High Scores</h3>';
    const list = document.createElement('ol');
    highScores.slice(0, 5).forEach(entry => {
      const li = document.createElement('li');
      li.textContent = `${entry.name ?? '---'}: ${entry.score ?? 0}`;
      list.appendChild(li);
    });
    gameList.appendChild(list);
  }

  // Post-death overlay scores
  const overlayList = document.getElementById('gameOverScores');
  if (overlayList) {
    overlayList.innerHTML = '<h3></h3>';
    const list = document.createElement('ol');
    highScores.slice(0, 5).forEach(entry => {
      const li = document.createElement('li');
      li.textContent = `${entry.name ?? '---'}: ${entry.score ?? 0}`;
      list.appendChild(li);
    });
    overlayList.appendChild(list);



  }

  console.log("Rendering high scores after game over");
}








function updateEnemies() {
    const noiseRadius = calculateNoiseRadius();


  

  enemies.forEach(enemy => {
    const dx = shipX - enemy.x;
    const dy = shipY - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

      // Escape mechanic: if the player is too deep, enemies lose track
    if (playerDepth > ESCAPE_DEPTH) {
      if (enemy.state === 'tracking' || enemy.state === 'searching') {
        enemy.state = 'idle';
        enemy.lastKnownX = null;
        enemy.lastKnownY = null;
      }
    }

    switch (enemy.state) {
      case 'idle':
        if (distance <= noiseRadius && noiseRadius > 0.01) {
          enemy.state = 'tracking';
          enemy.lastKnownX = shipX;
          enemy.lastKnownY = shipY;
        } else {
          // wander
          if (Math.random() < 0.01) {
            enemy.angle += (Math.random() - 0.5) * 0.5;
          }
          enemy.x += Math.sin(enemy.angle) * enemy.speed * 0.5;
          enemy.y += -Math.cos(enemy.angle) * enemy.speed * 0.5;
        }
        break;

      case 'tracking':
        if (distance <= noiseRadius && noiseRadius > 0.01) {
          enemy.lastKnownX = shipX;
          enemy.lastKnownY = shipY;
        } else {
          enemy.state = 'searching';
        }
        const angleToPlayer = Math.atan2(dy, dx);
        enemy.x += Math.cos(angleToPlayer) * enemy.speed;
        enemy.y += Math.sin(angleToPlayer) * enemy.speed;

        // Attack player if close
        const now = Date.now();
        if (distance < 30 && now - enemy.lastAttackTime > 1000) {
        
        playerHealth -= 10;
        playSegment(d_boom,0,1);
        document.getElementById('damageFlash').style.opacity = 1;
        setTimeout(() => {
        document.getElementById('damageFlash').style.opacity = 0;
        }, 100);

        enemy.lastAttackTime = now;
         

        if (playerHealth < 0 && !isGameOver) {
          //
          isGameOver = true; // Prevent repeat
          playerHealth = 0; // cap health at 0
          updateHealthBar(); // update visual bar
          gameRunning = false;  // ⬅️ This prevents further loop frames
            console.log('Calling cancelAnimationFrame with ID:', animationFrameId);
          cancelAnimationFrame(animationFrameId); // stop the game loop if you store it

          //que endgame music
          endSounds();
          endGamesound();
          
          document.getElementById('replayButton').style.display = 'block';
          document.getElementById('gameOverOverlay').style.display = 'flex';
          //scoreboard
            saveScore(killCount);   // 🟢 save score on death
            
            showHighScores();       // 🟢 show the scoreboard
          
          return; 

        }

        }
        break;

      case 'searching':
        if (enemy.lastKnownX === null) {
          enemy.state = 'idle';
          break;
        }
        const dx2 = enemy.lastKnownX - enemy.x;
        const dy2 = enemy.lastKnownY - enemy.y;
        const distToLast = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        if (distToLast > 5) {
          const angleToLast = Math.atan2(dy2, dx2);
          enemy.x += Math.cos(angleToLast) * enemy.speed;
          enemy.y += Math.sin(angleToLast) * enemy.speed;
        } else {
          enemy.state = 'idle';
        }
        break;
    }
  

  // Wrap enemies around the map edges
  enemy.x = (enemy.x + MAP_SIZE) % MAP_SIZE;
  enemy.y = (enemy.y + MAP_SIZE) % MAP_SIZE;
  });
}

function updateDayNight() {
  const deltaTime = 1 / 60;
  dayNightTime += deltaTime;
  if (dayNightTime >= DAY_LENGTH) dayNightTime -= DAY_LENGTH;
  const dayProgress = dayNightTime / DAY_LENGTH;
  brightness = 0.5 + 0.5 * Math.cos(dayProgress * 2 * Math.PI);
}

function drawDayNightOverlay() {
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${1 - brightness})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

//calculate the noise radius
function calculateNoiseRadius() {
  const isDay = brightness > 0.5;
  const speedBasedNoise = Math.sqrt(velocityX ** 2 + velocityY ** 2) * 75;

  if (isDay && playerDepth < ALT_NOISE_DEPTH) {
    return SURFACE_NOISE_RADIUS + killCount;
  } else {
    return speedBasedNoise;
  }
}

function updateHealthBar() {
  const healthBar = document.getElementById('healthBar');
  const healthPercent = Math.max(0, playerHealth) / 100;
  healthBar.style.width = `${healthPercent * 100}%`;

  if (healthPercent > 0.6) {
    healthBar.style.background = 'lime';
  } else if (healthPercent > 0.3) {
    healthBar.style.background = 'yellow';
  } else {
    healthBar.style.background = 'red';
  }
}









function loop() {
  //for air
  document.getElementById('airBar').style.width = (currentAir / maxAir * 100) + '%';




  //For the pause button
  if (isPaused) {
    animationFrameId = requestAnimationFrame(loop); // Still loop to check if resumed
    return;
  }


  if (!gameRunning) return;           // ⬅️ STOP scheduling more frames

  //waves variable
  waveOffset += 0.05;  // adjust speed: higher = faster



  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateShip();
  const noiseRadius = calculateNoiseRadius(); // NEW: get noise radius in its own function
  updateEnemies(noiseRadius);                // pass it so updateEnemies uses the same
  updateTorpedoes();
  updateDayNight();
  drawDayNightOverlay();
  updateAir();
  startSounds();

  //radar sweep pulser
  radarSweepAngle = (radarSweepAngle + radarSweepSpeed) % (Math.PI * 2);

  drawRadar();
  //drawMines();
  drawRadarSweep();
  drawEnemies();
  drawTorpedoes();
  drawShip();
  drawNoiseRing(noiseRadius); // draw it here!
  updateScoreboard();
   

  const healthBar = document.getElementById('healthBar');
  const healthPercent = Math.max(0, playerHealth) / 100;
  healthBar.style.width = `${healthPercent * 100}%`;

  // Optional: change color dynamically
  if (healthPercent > 0.6) {
    healthBar.style.background = 'lime';
  } else if (healthPercent > 0.3) {
    healthBar.style.background = 'yellow';
  } else {
    healthBar.style.background = 'red';
  }

  console.log('Game loop running');
  animationFrameId = requestAnimationFrame(loop);
  drawMinimap();
  drawDepthGauge();
  showHighScores();

}

// ---- Mobile Joystick Implementation ----/**/

const joystickBase = document.getElementById("joystickBase");
const joystickKnob = document.getElementById("joystickKnob");

let dragging = false;
let maxDistance = 50; // max radius of knob

joystickBase.addEventListener("touchstart", startDrag);
joystickBase.addEventListener("touchmove", drag);
joystickBase.addEventListener("touchend", endDrag);

function startDrag(event) {
  dragging = true;
}

function drag(event) {
  if (!dragging) return;
  const rect = joystickBase.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const touch = event.touches[0];
  const dx = touch.clientX - centerX;
  const dy = touch.clientY - centerY;

  // clamp distance
  const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
  const angle = Math.atan2(dy, dx);

  const knobX = distance * Math.cos(angle);
  const knobY = distance * Math.sin(angle);

  joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

  // normalize to -1..1 range
  const normalizedX = knobX / maxDistance;
  const normalizedY = knobY / maxDistance;

  // Replace keyboard keys with direct rudder & throttle control:
  rudderTarget = normalizedX;   // sideways control
  if (normalizedY < -0.3) {
    velocity += ACCELERATION;
    if (velocity > MAX_FORWARD_SPEED) velocity = MAX_FORWARD_SPEED;
  } else if (normalizedY > 0.3) {
    velocity -= ACCELERATION;
    if (velocity < MAX_REVERSE_SPEED) velocity = MAX_REVERSE_SPEED;
  }

  event.preventDefault();
}

function endDrag() {
  dragging = false;
  joystickKnob.style.transform = `translate(-50%, -50%)`;
  rudderTarget = 0; // reset rudder
}





uboatImage.onload = () => {
  if (!animationFrameId) {   // avoid starting multiple loops
    animationFrameId = requestAnimationFrame(loop);
  }
  
  //Pause button
  
  document.getElementById('pauseButton').addEventListener('click', () => {
  pauseSounds();

  isPaused = !isPaused;
  document.getElementById('pauseButton').textContent = isPaused ? '▶' : '❚❚';
  });


  /*replay button*/
  document.getElementById('replayButton').addEventListener('click', () => {
    location.reload();
  });
};

