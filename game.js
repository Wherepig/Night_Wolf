
// Initial enemy spawn
for (let i = 0; i < 10; i++) spawnEnemy();

document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

function gameLoop() {
  updatePlayer(keys);
  updateDayNight();
  updateEnemies();
  updateTorpedoes();

  radarCtx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);
  drawEnemies(radarCtx);
  drawTorpedoes(radarCtx);
  drawPlayerOnCanvas(radarCtx);

  drawDepthGauge();
  updateHealthBar();
  updateScoreboard();

  requestAnimationFrame(gameLoop);
}

gameLoop();
