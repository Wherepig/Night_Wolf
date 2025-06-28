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

  //This is for depth control
  if (keys['q']) {
  playerDepth -= DEPTH_STEP * 0.5;
  if (playerDepth < MIN_DEPTH) playerDepth = MIN_DEPTH;
    }
if (keys['e']) {
    playerDepth += DEPTH_STEP * 2.25;
    if (playerDepth > MAX_DEPTH) playerDepth = MAX_DEPTH;
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


module.exports = { updateShip };