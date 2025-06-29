function drawDepthGauge() {
  const waveY = depthCanvas.height * 0.1;
  const ctx = dctx;

  ctx.clearRect(0, 0, depthCanvas.width, depthCanvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, depthCanvas.width, depthCanvas.height);

  const gaugeHeight = depthCanvas.height - waveY;
  const depthRatio = playerDepth / MAX_DEPTH;
  const markerY = waveY + (depthRatio * gaugeHeight);

  ctx.fillStyle = 'white';
  ctx.fillRect(0, markerY - 1, depthCanvas.width, 2);

  const darkness = 1 - brightness;
  ctx.fillStyle = `rgba(0,0,30,${darkness * 0.7})`;
  ctx.fillRect(0, 0, depthCanvas.width, waveY);
}
