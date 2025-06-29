let enemies = [];

function spawnEnemy() {
  enemies.push({
    x: Math.random() * 2000 - 1000,
    y: Math.random() * 2000 - 1000,
    health: 1
  });
}

function updateEnemies() {
  for (const e of enemies) {
    // Simple enemy logic: move towards player
    const dx = playerX - e.x;
    const dy = playerY - e.y;
    const dist = Math.hypot(dx, dy);
    const speed = 0.5;
    e.x += (dx / dist) * speed;
    e.y += (dy / dist) * speed;

    // Check collision with player
    if (dist < 20) takeDamage(10);
  }
}

function drawEnemies(ctx) {
  ctx.fillStyle = 'red';
  for (const e of enemies) {
    const ex = radarCenterX + e.x - playerX;
    const ey = radarCenterY + e.y - playerY;
    ctx.beginPath();
    ctx.arc(ex, ey, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
