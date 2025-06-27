
//torpedoes
const torpedoes = [];
let lastTorpedoTime = 0;
const TORPEDO_COOLDOWN = 500; // ms



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
    // Fire torpedo
    torpedoes.push({
      x: shipX,
      y: shipY,
      angle: shipAngle,
      speed: 5,
      life: 2000, // 2 seconds lifetime
      spawnTime: Date.now()
    });
    lastTorpedoTime = Date.now();
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
const NUM_ENEMIES = 100; //here is the set number of enemies
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
  const isThrottling = keys['w'] || keys['s'];
  if (isThrottling) {
    if (keys['a']) rudderTarget = -1;
    else if (keys['d']) rudderTarget = 1;
    else rudderTarget = 0;
  } else {
    rudderTarget = 0;
  }

  // Smooth rudder control
  if (rudderAngle < rudderTarget) {
    rudderAngle += RUDDER_RATE;
    if (rudderAngle > rudderTarget) rudderAngle = rudderTarget;
  } else if (rudderAngle > rudderTarget) {
    rudderAngle -= RUDDER_RATE;
    if (rudderAngle < rudderTarget) rudderAngle = rudderTarget;
  }

  if (Math.abs(velocity) > 0.01) {
    shipAngle += rudderAngle * TURN_SPEED;
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

    /*
    for (let a = 0; a < 360; a += 30) {
      const rad = a * Math.PI / 180;
      //ctx.strokeStyle = 'lime'; change the color of the radar sweep
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius * Math.cos(rad), radius * Math.sin(rad));
      ctx.stroke();
    }*/
    ctx.restore();
  }
/*
function drawMines() {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-shipAngle);
  ctx.fillStyle = 'red';

  for (let m of mines) {
    const dx = m.x - shipX;
    const dy = m.y - shipY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius + 20) {
      ctx.beginPath();
      ctx.arc(dx, dy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
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


function drawSpeedRing() {
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

function updateEnemies() {
  const noiseRadius = Math.sqrt(velocityX ** 2 + velocityY ** 2) * 75;

  enemies.forEach(enemy => {
    const dx = shipX - enemy.x;
    const dy = shipY - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

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

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateShip();
  updateEnemies();
  updateTorpedoes();

  //radar sweep pulser
  radarSweepAngle = (radarSweepAngle + radarSweepSpeed) % (Math.PI * 2);

  drawRadar();
  //drawMines();
  drawRadarSweep();
  drawEnemies();
  drawTorpedoes();
  drawShip();
  drawSpeedRing();
  document.getElementById('health').textContent = `Health: ${Math.max(0, playerHealth)}%`;

  requestAnimationFrame(loop);
  drawMinimap();

}

loop();