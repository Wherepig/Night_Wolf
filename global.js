// CANVAS & CONTEXT
const radarCanvas = document.getElementById("radar");
const radarCtx = radarCanvas.getContext("2d");
const depthCanvas = document.getElementById("depthCanvas");
const dctx = depthCanvas.getContext("2d");

// CANVAS CENTER
const radarCenterX = radarCanvas.width / 2;
const radarCenterY = radarCanvas.height / 2;

// PLAYER STATE
let playerX = radarCenterX;
let playerY = radarCenterY;
let playerHealth = 100;
let playerDepth = 0;

// INPUT
let keys = {};

// ENEMIES & TORPEDOES
let enemies = [];
let torpedoes = [];

// GAME STATE
let killCount = 0;
let dayNightTime = 0;
let brightness = 1;

// CONSTANTS
const MAX_DEPTH = 600;
const ESCAPE_DEPTH = 300;
const NOISE_DEPTH_THRESHOLD = 150;
const CRUSH_DEPTH = 550;
const DAY_LENGTH = 60000;  // 60 seconds
