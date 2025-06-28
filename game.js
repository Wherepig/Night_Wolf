//variable for noise depth
const NOISE_DEPTH_THRESHOLD = 100; // meters; adjust as needed
const SURFACE_NOISE_RADIUS = 100;  // fixed noise radius if too shallow
const ESCAPE_DEPTH = 200;  // e.g., must dive below 200m to lose enemies

//Variables for crush depth
const CRUSH_DEPTH = 250;        // e.g., below 400m starts taking damage
const CRUSH_DAMAGE_RATE = 10;   // health lost per second







//day and night cycle values

let brightness = 1;
const DAY_LENGTH = 120; // seconds for full day-night cycle
let dayNightTime = DAY_LENGTH * 0.5;  // keeps track of elapsed time



//score
let killCount = 0;

//player's depth
let playerDepth = 0;           // in meters or arbitrary units
const MAX_DEPTH = 500;         // maximum submarine depth
const MIN_DEPTH = 0;           // surface level
const DEPTH_STEP = 2;          // depth change per key press

//Image of the uboat
const uboatImage = new Image();
uboatImage.src = 'small_uboat_2.png';



//torpedoes
const torpedoes = [];
let lastTorpedoTime = 0;
const TORPEDO_COOLDOWN = 500; // ms


//depth canvas
const depthCanvas = document.getElementById('depthCanvas');
const dctx = depthCanvas.getContext('2d');

//Radar screen: 
const canvas = document.getElementById('radar');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 300;
//Radar screen sweep pulser
let radarSweepAngle = 0; // radians
const radarSweepSpeed = 0.02; // radians per frame






//other radar screen to tell your where other enemies are: 
const minimap = document.getElementById('minimap');
const mctx = minimap.getContext('2d');
const minimapSize = 200; // pixel size


const MAP_SIZE = 5000;
let playerHealth = 100;
let shipX = MAP_SIZE / 2;
let shipY = MAP_SIZE / 2;
let shipAngle = 0;
let velocity = 0;
let velocityX = 0;
let velocityY = 0;

const MAX_FORWARD_SPEED = 3;                            //<---------- max speed for your ship
const MAX_REVERSE_SPEED = -1.5;
const ACCELERATION = 0.05;
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
        torpedoes.splice(i, 1);

        killCount++; //                     <------ increase kill count
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
const NUM_ENEMIES = 200; //                                    <-----------here is the set number of enemies
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


function updateShip() {

    if (keys['a']) rudderTarget = -1;
    else if (keys['d']) rudderTarget = 1;
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
    if (keys['q']) {
    playerDepth -= DEPTH_STEP * 0.5;
    if (playerDepth < MIN_DEPTH) playerDepth = MIN_DEPTH;
    }
    if (keys['e']) {
    playerDepth += DEPTH_STEP * 2.25;
    if (playerDepth > MAX_DEPTH) playerDepth = MAX_DEPTH;
    }


    // Check for crush depth damage
    if (playerDepth > CRUSH_DEPTH) {
      const damagePerFrame = (CRUSH_DAMAGE_RATE / 60); // damage per frame @ 60fps
      playerHealth -= damagePerFrame;

      if (playerHealth <= 0) {
        alert("💥 Your submarine was crushed by the deep pressure!");
        location.reload();
      }
    }



    velocityX = Math.sin(shipAngle) * velocity;
    velocityY = -Math.cos(shipAngle) * velocity;

    shipX += velocityX;
    shipY += velocityY;

    let deg = shipAngle * 180 / Math.PI;
    if (deg < 0) deg += 360;
    document.getElementById('compass').textContent =
        `Position: (${Math.floor(shipX)}, ${Math.floor(shipY)}), Heading: ${deg.toFixed(1)}°, Speed: ${velocity.toFixed(2)}, Rudder: ${rudderAngle.toFixed(2)}`;


    // Wrap player ship around the map edges
    shipX = (shipX + MAP_SIZE) % MAP_SIZE;
    shipY = (shipY + MAP_SIZE) % MAP_SIZE;

  }

  
function updateScoreboard() {
  const tallyPerCross = 10;
  const crosses = Math.floor(killCount / tallyPerCross);
  const tallies = killCount % tallyPerCross;

  let scoreText = '';

  // Add crosses for each ten kills
  for (let i = 0; i < crosses; i++) {
    scoreText += '✠ '; // or '✙' or custom cross symbol
  }

  // Add tally marks for remaining kills
  for (let i = 0; i < tallies; i++) {
    scoreText += '|';
  }

  document.getElementById('scoreboard').textContent = `Score: ${scoreText}`;
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

  dctx.strokeStyle = 'white';
  dctx.lineWidth = 2;
  dctx.beginPath();
  for (let x = 0; x <= depthCanvas.width; x++) {
    const yOffset = Math.sin(x * waveFrequency) * waveAmplitude;
    if (x === 0) dctx.moveTo(x, waveY + yOffset);
    else dctx.lineTo(x, waveY + yOffset);
  }
  dctx.stroke();

  // Draw scale line
  //dctx.strokeStyle = 'lime';
  //dctx.lineWidth = 2;
  //dctx.beginPath();
  //dctx.moveTo(depthCanvas.width / 2, waveY);
  //dctx.lineTo(depthCanvas.width / 2, depthCanvas.height);
  //dctx.stroke();

  // Calculate marker position: 0m → waveY, MAX_DEPTH → depthCanvas.height
  const gaugeHeight = depthCanvas.height - waveY; // distance from wave to bottom
  const depthRatio = playerDepth / MAX_DEPTH;
  const markerY = waveY + (depthRatio * gaugeHeight);

  // Draw current depth marker <--------------This is where you want to draw a submarine


    // Draw main body
    dctx.save();
    dctx.translate(depthCanvas.width / 2, markerY);
    dctx.drawImage(uboatImage, -50, -37, 96, 69); // draw centered
    dctx.restore();



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
  dctx.fillText(`Firing Depth `, 5, firingY - 5);

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


/*function drawNoiseRing() {
  const speed = Math.sqrt(velocityX ** 2 + velocityY ** 2);
  if (speed < 0.01) return; // Don't draw if stationary

  const maxRadius = 150;  // max visual size
  const radius = speed * 75;  // scale factor (adjust as needed)

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(0, 255, 255, ${Math.min(speed / 3, 0.5)})`; // cyan glow fades with speed
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
*/

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
        playerHealth -= 25;
        
        document.getElementById('damageFlash').style.opacity = 1;
        setTimeout(() => {
        document.getElementById('damageFlash').style.opacity = 0;
        }, 100);

        enemy.lastAttackTime = now;
        if (playerHealth <= 0) {
            alert("💀 You've been destroyed by enemy fire!");
            location.reload();
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

  if (isDay && playerDepth < NOISE_DEPTH_THRESHOLD) {
    return SURFACE_NOISE_RADIUS;
  } else {
    return speedBasedNoise;
  }
}




function loop() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateShip();
  const noiseRadius = calculateNoiseRadius(); // NEW: get noise radius in its own function
  updateEnemies(noiseRadius);                // pass it so updateEnemies uses the same
  updateTorpedoes();
  updateDayNight();
  drawDayNightOverlay();

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

  document.getElementById('health').textContent = `Health: ${Math.max(0, playerHealth)}%`;

  requestAnimationFrame(loop);
  drawMinimap();
  drawDepthGauge();


}

uboatImage.onload = () => {
  loop(); // start your game loop once image is ready
};
