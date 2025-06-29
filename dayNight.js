let dayNightTime = 0;
const DAY_LENGTH = 60000; // 60 seconds per full cycle
let brightness = 1; // 1: day, 0: night

function updateDayNight() {
  dayNightTime = (dayNightTime + 16) % DAY_LENGTH;
  const progress = (dayNightTime / DAY_LENGTH) % 1;
  brightness = Math.sin(progress * 2 * Math.PI) * 0.5 + 0.5; // 0..1 brightness
}
