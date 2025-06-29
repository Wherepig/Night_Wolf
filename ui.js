function updateHealthBar() {
  const bar = document.getElementById("healthBar");
  bar.style.width = `${playerHealth}%`;
}

function updateScoreboard() {
  document.getElementById("scoreboard").textContent = `Kills: ${killCount}`;
}

function showGameOver() {
  document.getElementById("gameOverOverlay").style.display = "flex";
}

document.getElementById("replayButton")?.addEventListener("click", () => {
  location.reload();
});
