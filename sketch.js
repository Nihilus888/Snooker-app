// ==========================
// Matter.js aliases
// ==========================
const { Engine, World, Bodies, Body } = Matter;

// ==========================
// Globals
// ==========================
let engine, world;

let tableLength = 720;
let tableWidth = tableLength / 2;
let ballDiameter = tableWidth / 36;
let pocketDiameter = ballDiameter * 1.5;

let balls = [];
let cueBall;
let walls = [];

let currentMode = 1;

// Cue interaction
let aiming = false;
let shotPower = 0.02;
let maxPower = 0.06;
let minPower = 0.005;

// Cue-ball placement
let placingCueBall = true;
let dZone = {};

// ==========================
// Setup
// ==========================
function setup() {
  createCanvas(1000, 600);
  engine = Engine.create();
  world = engine.world;
  world.gravity.y = 0;

  setupTable();
  setupCueBall();
  setupMode(1);
}

// ==========================
// Table & walls
// ==========================
function setupTable() {
  let tableX = (width - tableLength) / 2;
  let tableY = (height - tableWidth) / 2;

  walls = [
    Bodies.rectangle(tableX + tableLength/2, tableY - 10, tableLength, 20, { isStatic: true }),
    Bodies.rectangle(tableX + tableLength/2, tableY + tableWidth + 10, tableLength, 20, { isStatic: true }),
    Bodies.rectangle(tableX - 10, tableY + tableWidth/2, 20, tableWidth, { isStatic: true }),
    Bodies.rectangle(tableX + tableLength + 10, tableY + tableWidth/2, 20, tableWidth, { isStatic: true })
  ];

  World.add(world, walls);

  dZone = {
    x: tableX + tableLength * 0.125,
    y: tableY + tableWidth / 2,
    r: tableWidth / 4
  };
}

// ==========================
// Cue ball (human placed)
// ==========================
function setupCueBall() {
  cueBall = Bodies.circle(dZone.x, dZone.y, ballDiameter/2, {
    restitution: 0.9,
    frictionAir: 0.02,
    isStatic: true,
    label: 'cueBall'
  });
  balls.push(cueBall);
  World.add(world, cueBall);
}

// ==========================
// Modes
// ==========================
function setupMode(mode) {
  currentMode = mode;

  balls = balls.filter(b => b.label === 'cueBall');
  World.clear(world, false);
  World.add(world, walls);
  World.add(world, cueBall);

  addColouredBalls();

  if (mode === 1) addStandardReds();
  if (mode === 2) addRandomClusterReds();
  if (mode === 3) addPracticeReds();
}

// ==========================
// Reds
// ==========================
function addStandardReds() {
  let tableX = (width - tableLength) / 2;
  let tableY = (height - tableWidth) / 2;

  let startX = tableX + tableLength * 0.7;
  let startY = tableY + tableWidth / 2 - 2 * ballDiameter;

  for (let row = 0; row < 5; row++) {
    for (let i = 0; i <= row; i++) {
      createBall(
        startX + row * ballDiameter,
        startY + (i - row/2) * ballDiameter * 1.9,
        'red'
      );
    }
  }
}

function addRandomClusterReds() {
  let tableX = (width - tableLength) / 2;
  let tableY = (height - tableWidth) / 2;

  let cx = tableX + tableLength * 0.7;
  let cy = tableY + tableWidth / 2;

  for (let i = 0; i < 15; i++) {
    createBall(
      cx + random(-40, 40),
      cy + random(-40, 40),
      'red'
    );
  }
}

function addPracticeReds() {
  let tableX = (width - tableLength) / 2;
  let tableY = (height - tableWidth) / 2;

  for (let i = 0; i < 6; i++) {
    createBall(
      tableX + tableLength * 0.6 + i * ballDiameter * 1.5,
      tableY + tableWidth / 2,
      'red'
    );
  }
}

// ==========================
// Coloured balls
// ==========================
function addColouredBalls() {
  let tableX = (width - tableLength) / 2;
  let tableY = (height - tableWidth) / 2;

  let data = [
    ['yellow', tableX + tableLength*0.125, tableY + tableWidth*0.25],
    ['green',  tableX + tableLength*0.125, tableY + tableWidth*0.75],
    ['brown',  tableX + tableLength*0.125, tableY + tableWidth*0.5],
    ['blue',   tableX + tableLength*0.5,   tableY + tableWidth*0.5],
    ['pink',   tableX + tableLength*0.75,  tableY + tableWidth*0.5],
    ['black',  tableX + tableLength*0.9,   tableY + tableWidth*0.5]
  ];

  for (let c of data) createBall(c[1], c[2], c[0]);
}

// ==========================
// Ball creation helper
// ==========================
function createBall(x, y, label) {
  let b = Bodies.circle(x, y, ballDiameter/2, {
    restitution: 0.9,
    frictionAir: 0.02,
    label
  });
  balls.push(b);
  World.add(world, b);
}

// ==========================
// Draw loop
// ==========================
function draw() {
  background(0, 120, 0);
  Engine.update(engine);

  drawTable();
  drawPockets();
  drawDZone();
  drawBalls();

  if (!placingCueBall) drawCue();
  drawPowerBar();

  if (!placingCueBall && !aiming && allBallsStopped()) aiming = true;
}

// ==========================
// Rendering helpers
// ==========================
function drawTable() {
  let x = (width - tableLength) / 2;
  let y = (height - tableWidth) / 2;
  stroke(120, 60, 20);
  strokeWeight(20);
  fill(0, 100, 0);
  rect(x, y, tableLength, tableWidth, 20);
}

function drawPockets() {
  let x = (width - tableLength) / 2;
  let y = (height - tableWidth) / 2;
  fill(0);
  noStroke();

  let p = [
    [x,y],[x+tableLength/2,y],[x+tableLength,y],
    [x,y+tableWidth],[x+tableLength/2,y+tableWidth],[x+tableLength,y+tableWidth]
  ];
  for (let pt of p) ellipse(pt[0], pt[1], pocketDiameter);
}

function drawDZone() {
  if (!placingCueBall) return;
  noFill();
  stroke(255,255,0);
  arc(dZone.x, dZone.y, dZone.r*2, dZone.r*2, PI/2, 3*PI/2);
}

function drawBalls() {
  for (let b of balls) {
    fill(getBallColor(b.label));
    ellipse(b.position.x, b.position.y, ballDiameter);
  }
}

function getBallColor(label) {
  if (label === 'cueBall') return 'white';
  if (label === 'red') return 'red';
  return label;
}

// ==========================
// Cue
// ==========================
function drawCue() {
  if (!aiming) return;
  let p = cueBall.position;
  let a = atan2(mouseY - p.y, mouseX - p.x);

  push();
  translate(p.x, p.y);
  rotate(a);
  stroke(200,170,120);
  strokeWeight(6);
  line(-120 - shotPower*2000, 0, -20, 0);
  pop();
}

function drawPowerBar() {
  fill(255);
  text("Power", 20, height - 40);
  noFill();
  stroke(255);
  rect(20, height - 30, 150, 10);
  noStroke();
  fill(255,0,0);
  rect(20, height - 30, map(shotPower, minPower, maxPower, 0, 150), 10);
}

// ==========================
// Input
// ==========================
function mouseDragged() {
  if (!placingCueBall) return;

  let dx = mouseX - dZone.x;
  let dy = mouseY - dZone.y;
  let d = sqrt(dx*dx + dy*dy);

  if (d <= dZone.r)
    Body.setPosition(cueBall, {x: mouseX, y: mouseY});
  else {
    let a = atan2(dy, dx);
    Body.setPosition(cueBall, {
      x: dZone.x + cos(a)*dZone.r,
      y: dZone.y + sin(a)*dZone.r
    });
  }
}

function keyPressed() {
  if (key === '1') setupMode(1);
  if (key === '2') setupMode(2);
  if (key === '3') setupMode(3);

  if (placingCueBall && key === ' ') {
    placingCueBall = false;
    Body.setStatic(cueBall, false);
    aiming = true;
    return;
  }

  if (!placingCueBall) {
    if (keyCode === UP_ARROW) shotPower = min(shotPower + 0.005, maxPower);
    if (keyCode === DOWN_ARROW) shotPower = max(shotPower - 0.005, minPower);
    if (key === ' ') strikeCueBall();
  }
}

function strikeCueBall() {
  if (!aiming) return;
  let p = cueBall.position;
  let a = atan2(mouseY - p.y, mouseX - p.x);
  Body.applyForce(cueBall, p, {
    x: cos(a)*shotPower,
    y: sin(a)*shotPower
  });
  aiming = false;
}

// ==========================
function allBallsStopped() {
  return balls.every(b => abs(b.velocity.x) < 0.05 && abs(b.velocity.y) < 0.05);
}
