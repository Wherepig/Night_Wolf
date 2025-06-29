let torpedoes = [];

function updateTorpedoes() {
  const now = Date.now();
  for (let i = torpedoes.length - 1; i >= 0; i--) {
    const t = torpedoes[i];
    t.x += Math.sin(t.angle) * t.speed;
    t.y += -Math.cos(t.angle) * t.speed;

    if (now - t.spawnTime > t.life) {
      torpedoes.splice(i, 1);
      continue;
    }

    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const dx = t.x - e.x;
      const dy = t.y - e.y;
      if (Math.hypot(dx, dy) < 10) {
        enemies.splice(j, 1);
        torpedoes.splice(i, 1);
        killCount++;
        break;
      }
    }
  }
}

function drawTorpedoes(ctx) {
  ctx.fillStyle = 'yellow';
  for (const t of torpedoes) {
    const tx = radarCenterX + t.x - playerX;
    const ty = radarCenterY + t.y - playerY;
    ctx.beginPath();
    ctx.arc(tx, ty, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
