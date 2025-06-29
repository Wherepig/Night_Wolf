
let playerAngle = 0;  // Facing direction (if needed)



// Constants
const PLAYER_SPEED = 2;       // Example speed value

// Movement controls
function updatePlayer(keys) {
  if (keys["KeyW"]) playerY -= PLAYER_SPEED;
  if (keys["KeyS"]) playerY += PLAYER_SPEED;
  if (keys["KeyA"]) playerX -= PLAYER_SPEED;
  if (keys["KeyD"]) playerX += PLAYER_SPEED;

  // Clamp to max depth (staying within gauge limits)
  playerDepth = Math.max(0, Math.min(playerDepth, MAX_DEPTH));
}

// Torpedo firing logic
function canFireTorpedo() {
  // Torpedoes can only fire above firing threshold
  return playerDepth <= NOISE_DEPTH_THRESHOLD;
}

function fireTorpedo() {
  if (!canFireTorpedo()) return;

  torpedoes.push({
    x: playerX,
    y: playerY,
    angle: playerAngle,
    speed: 5,
    spawnTime: Date.now(),
    life: 3000,
    firedBy: "player"
  });
}

// Damage & death
function takeDamage(amount) {
  playerHealth -= amount;
  if (playerHealth <= 0) {
    handlePlayerDeath();
  }
}

// Death handling
function handlePlayerDeath() {
  playerHealth = 0;
  showGameOver();
}

// Optional drawing (if needed outside radar)
function drawPlayerOnCanvas(ctx) {
  ctx.save();
  ctx.translate(playerX, playerY);
  ctx.rotate(playerAngle);
  ctx.fillStyle = "lime";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
