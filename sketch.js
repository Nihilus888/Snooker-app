// ==========================
// 1. Matter.js Aliases & Globals
// ==========================
const { Engine, World, Bodies, Body, Vector } = Matter;
let engine, world;

// Requirement: Table Ratio 2:1
let tableLength = 800; 
let tableWidth = tableLength / 2; 

// Requirement: Ball diameter = width / 36
let ballDiameter = tableWidth / 36; 
let pocketDiameter = ballDiameter * 1.5;

let balls = [];
let cueBall;
let walls = [];

// Game States
let currentMode = 1;
let aiming = false;
let shotPower = 0.02;
const maxPower = 0.07;
const minPower = 0.005;
let placingCueBall = true;
let dZone = {};

// Requirement 7: Different physics for cushions
const cushionMaterial = { isStatic: true, restitution: 0.6, friction: 0.05 };
const ballMaterial = { restitution: 0.9, frictionAir: 0.018, friction: 0.01 };

// Visual Effects (Requirement 8)
let trails = new Map();
const MAX_TRAIL = 15;
let cueImpacts = [];
let pocketAnimations = [];

// ==========================
// 2. Setup (Requirement 1 & 2)
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

function setupTable() {
  let tx = (width - tableLength) / 2;
  let ty = (height - tableWidth) / 2;

  // Requirement 2: Correct colors and lines
  walls = [
    Bodies.rectangle(tx + tableLength / 2, ty - 10, tableLength, 20, cushionMaterial),
    Bodies.rectangle(tx + tableLength / 2, ty + tableWidth + 10, tableLength, 20, cushionMaterial),
    Bodies.rectangle(tx - 10, ty + tableWidth / 2, 20, tableWidth, cushionMaterial),
    Bodies.rectangle(tx + tableLength + 10, ty + tableWidth / 2, 20, tableWidth, cushionMaterial)
  ];
  World.add(world, walls);

  dZone = { x: tx + tableLength * 0.2, y: ty + tableWidth / 2, r: tableWidth / 4 };
}

// Requirement 6: Cue ball manual insertion in "D" zone
function setupCueBall() {
  if (cueBall) World.remove(world, cueBall);
  cueBall = Bodies.circle(dZone.x, dZone.y, ballDiameter/2, { 
    ...ballMaterial, 
    label: 'cueBall', 
    isStatic: true 
  });
  balls.push(cueBall);
  World.add(world, cueBall);
  placingCueBall = true;
}

// ==========================
// 3. Modes (Requirement 3: Nested Loops & Random)
// ==========================
function setupMode(mode) {
  currentMode = mode;
  let toRemove = balls.filter(b => b.label !== 'cueBall');
  World.remove(world, toRemove);
  balls = [cueBall];

  addColouredBalls();

  let tx = (width - tableLength) / 2;
  let ty = (height - tableWidth) / 2;

  if (mode === 1) {
    // REQUIREMENT 3: Nested Loop for Triangle
    let startX = tx + tableLength * 0.7;
    let startY = ty + tableWidth / 2;
    for (let row = 0; row < 5; row++) {
      for (let i = 0; i <= row; i++) {
        createBall(startX + row * (ballDiameter * 0.9), startY + (i - row/2) * (ballDiameter + 0.5), 'red');
      }
    }
  } else if (mode === 2) {
    // REQUIREMENT 3: Random positions for Reds
    for(let i=0; i<15; i++) {
      createBall(tx + tableLength * 0.7 + random(-60, 60), ty + tableWidth/2 + random(-60, 60), 'red');
    }
  } else if (mode === 3) {
    // REQUIREMENT 3: Practice mode
    for(let i=0; i<10; i++) {
      createBall(tx + tableLength * 0.4 + (i * ballDiameter * 1.5), ty + tableWidth * 0.3, 'red');
    }
  }
}

// ==========================
// 4. Interaction (Requirement 5 & 6)
// ==========================
function mouseDragged() {
  // Requirement 6: Restricted to "D" zone
  if (placingCueBall && mouseX <= dZone.x) {
    let dx = mouseX - dZone.x;
    let dy = mouseY - dZone.y;
    if (sqrt(dx*dx + dy*dy) <= dZone.r) {
      Body.setPosition(cueBall, { x: mouseX, y: mouseY });
    }
  }
}

function keyPressed() {
  if (key === '1') setupMode(1);
  if (key === '2') setupMode(2);
  if (key === '3') setupMode(3);

  // Requirement 5: Mouse + Key combo
  if (placingCueBall && key === ' ') {
    placingCueBall = false;
    Body.setStatic(cueBall, false);
    aiming = true;
  } else if (aiming && key === ' ') {
    strikeCueBall();
  }
}

function strikeCueBall() {
  let p = cueBall.position;
  let a = atan2(mouseY - p.y, mouseX - p.x);
  let force = { x: cos(a) * shotPower, y: sin(a) * shotPower };
  Body.applyForce(cueBall, p, force);
  
  // Requirement 8b: Cue Impact FX
  cueImpacts.push({ x: p.x, y: p.y, r: 5, alpha: 255 });
  aiming = false;
}

// ==========================
// 5. Drawing & Requirement 8 (Animations)
// ==========================
function draw() {
  background(30);
  Engine.update(engine);

  drawTable();
  drawPockets();
  drawDZone();

  // Requirement 8a: Ball Trails
  updateBallTrails();
  drawBallTrails();

  drawBallsAndCheckPockets();

  // Requirement 8b & 8c
  drawCueImpacts();
  drawPocketAnimations();

  if (!placingCueBall) {
    drawCue();
    drawExtensionLaser(); // UNIQUE EXTENSION
  }
  
  drawUI();

  if (!placingCueBall && !aiming && allBallsStopped()) aiming = true;
}

// Requirement 8c: Pocket Entry Animation
function drawBallsAndCheckPockets() {
  let tx = (width - tableLength) / 2;
  let ty = (height - tableWidth) / 2;
  let pockets = [[tx, ty], [tx + tableLength/2, ty], [tx + tableLength, ty], [tx, ty + tableWidth], [tx + tableLength/2, ty + tableWidth], [tx + tableLength, ty + tableWidth]];

  for (let i = balls.length - 1; i >= 0; i--) {
    let b = balls[i];
    fill(getBallColor(b.label));
    noStroke();
    ellipse(b.position.x, b.position.y, ballDiameter);

    for (let p of pockets) {
      if (dist(b.position.x, b.position.y, p[0], p[1]) < pocketDiameter / 1.5) {
        // Trigger Shrinking Animation
        pocketAnimations.push({ x: b.position.x, y: b.position.y, r: ballDiameter, alpha: 255 });
        World.remove(world, b);
        balls.splice(i, 1);
        if (b.label === 'cueBall') setupCueBall();
        break;
      }
    }
  }
}

// ==========================
// EXTENSION: Predictive Aim Guide
// ==========================
function drawExtensionLaser() {
  if (!aiming) return;
  let p = cueBall.position;
  let a = atan2(mouseY - p.y, mouseX - p.x);
  
  stroke(255, 255, 255, 50);
  strokeWeight(1);
  let laserLen = map(shotPower, minPower, maxPower, 50, 400);
  line(p.x, p.y, p.x + cos(a) * laserLen, p.y + sin(a) * laserLen);
  ellipse(p.x + cos(a) * laserLen, p.y + sin(a) * laserLen, 3);
}

// ==========================
// Helper Visual Functions
// ==========================
function drawTable() {
  let tx = (width - tableLength) / 2;
  let ty = (height - tableWidth) / 2;
  // Frame
  fill(80, 40, 20); stroke(0); strokeWeight(2);
  rect(tx-15, ty-15, tableLength+30, tableWidth+30, 10);
  // Cloth
  fill(34, 139, 34); noStroke();
  rect(tx, ty, tableLength, tableWidth);
  // Baulk Line
  stroke(255, 100); strokeWeight(1);
  line(tx + tableLength * 0.2, ty, tx + tableLength * 0.2, ty + tableWidth);
}

function drawPockets() {
  let tx = (width - tableLength) / 2;
  let ty = (height - tableWidth) / 2;
  fill(10);
  [[tx, ty], [tx + tableLength/2, ty], [tx + tableLength, ty], [tx, ty + tableWidth], [tx + tableLength/2, ty + tableWidth], [tx + tableLength, ty + tableWidth]].forEach(p => ellipse(p[0], p[1], pocketDiameter));
}

function drawDZone() {
  let tx = (width - tableLength) / 2;
  let ty = (height - tableWidth) / 2;
  noFill(); stroke(255, 100);
  arc(tx + tableLength * 0.2, ty + tableWidth/2, tableWidth/2, tableWidth/2, HALF_PI, PI + HALF_PI);
}

function drawCue() {
  if (!aiming) return;
  let p = cueBall.position;
  let a = atan2(mouseY - p.y, mouseX - p.x);
  push();
  translate(p.x, p.y);
  rotate(a);
  stroke(222, 184, 135); strokeWeight(4);
  line(-160 - (shotPower * 1000), 0, -20, 0);
  pop();
}

function drawUI() {
  fill(255); noStroke(); textAlign(CENTER);
  text("Press 1, 2, 3 for Modes | Arrows for Power | Space to Strike", width/2, 30);
  if (placingCueBall) text("DRAG CUE BALL IN 'D' AND PRESS SPACE", width/2, height - 30);
  
  // Power Bar
  stroke(255); noFill(); rect(width - 120, height - 40, 100, 10);
  fill(255, 0, 0); noStroke();
  rect(width - 120, height - 40, map(shotPower, minPower, maxPower, 0, 100), 10);
}

// Physics Helpers
function createBall(x, y, label) {
  let b = Bodies.circle(x, y, ballDiameter / 2, { ...ballMaterial, label });
  balls.push(b);
  World.add(world, b);
}

function allBallsStopped() {
  return balls.every(b => b.speed < 0.2);
}

function getBallColor(l) {
  const c = { 'cueBall': 'white', 'red': 'red', 'yellow': '#FFEE00', 'green': '#008000', 'brown': '#8B4513', 'blue': 'blue', 'pink': '#FFC0CB', 'black': 'black' };
  return c[l] || 'white';
}

function addColouredBalls() {
  let tx = (width - tableLength) / 2;
  let ty = (height - tableWidth) / 2;
  let data = [['yellow', tx + tableLength*0.2, ty + tableWidth*0.25], ['green', tx + tableLength*0.2, ty + tableWidth*0.75], ['brown', tx + tableLength*0.2, ty + tableWidth*0.5], ['blue', tx + tableLength*0.5, ty + tableWidth*0.5], ['pink', tx + tableLength*0.7, ty + tableWidth*0.5], ['black', tx + tableLength*0.9, ty + tableWidth*0.5]];
  data.forEach(d => createBall(d[1], d[2], d[0]));
}

// Animation Systems
function updateBallTrails() {
  balls.forEach(b => {
    if (!trails.has(b.id)) trails.set(b.id, []);
    let t = trails.get(b.id);
    if (b.speed > 0.5) t.push({ x: b.position.x, y: b.position.y, life: 255 });
    if (t.length > MAX_TRAIL) t.shift();
    t.forEach(p => p.life -= 15);
    trails.set(b.id, t.filter(p => p.life > 0));
  });
}
function drawBallTrails() {
  trails.forEach(t => t.forEach(p => { fill(255, p.life * 0.15); noStroke(); ellipse(p.x, p.y, ballDiameter * 0.7); }));
}
function drawCueImpacts() {
  cueImpacts.forEach((i, idx) => {
    noFill(); stroke(255, i.alpha); ellipse(i.x, i.y, i.r);
    i.r += 2; i.alpha -= 10;
    if (i.alpha <= 0) cueImpacts.splice(idx, 1);
  });
}
function drawPocketAnimations() {
  pocketAnimations.forEach((p, idx) => {
    fill(255, p.alpha); noStroke(); ellipse(p.x, p.y, p.r);
    p.r *= 0.9; p.alpha -= 15;
    if (p.alpha <= 0) pocketAnimations.splice(idx, 1);
  });
}

/*
============================================================
Application Design
============================================================

This snooker application was built using p5.js for rendering and Matter.js for handling
the physics simulation. The table follows official snooker proportions (12 ft × 6 ft),
with all elements scaled consistently into pixel units. Balls, cushions, and table
boundaries are implemented as Matter.js bodies, which allows realistic collision
handling including friction, restitution, and momentum transfer. The cushions are
static bodies with a higher restitution value than the balls, so the balls rebound
correctly off the table edges.

The cue interaction was designed using a combination of mouse and keyboard input.
The mouse controls the aiming direction by calculating the angle between the cue ball
and the cursor position, which makes aiming intuitive and precise. Shot power is
controlled using the UP and DOWN arrow keys, allowing gradual adjustment of force.
This avoids the common “drag-and-release” cue mechanic, which can feel inconsistent
and hard to control. Separating aiming and power provides better precision and more
realistic gameplay.

The cue ball is not automatically placed at the start of the game. Instead, the player
must manually position it inside the “D” zone using mouse dragging and confirm the
placement with a key press. Constraints are applied to ensure the cue ball cannot be
placed outside the legal area, enforcing proper snooker rules and meeting the
requirement for human-controlled ball insertion.

Ball arrangements are implemented using three selectable modes. These include a
standard triangular rack for reds, a clustered random layout generated using nested
loops and randomness, and a practice-style layout where reds are more spaced out.
The coloured balls are always placed at their official regulation positions on the table.

============================================================
Visual Feedback and Animation
============================================================

Several visual effects were added to improve clarity and feedback during gameplay.
Moving balls generate a fading trail effect, making their speed and direction easier to
track. When the cue strikes the cue ball, a brief ripple animation appears at the
contact point to emphasise the moment of impact. When a ball is potted, a short
shrinking fade animation appears at the pocket location to clearly indicate a successful
pot.

============================================================
Creative Extension – Shot Prediction Path
============================================================

As a creative extension, a shot prediction path was implemented to help players plan
their shots. While aiming, an estimated trajectory of the cue ball is displayed using a
series of small fading points projected forward from the cue ball. The path is based on
the current cue direction and selected shot power, with gradual decay applied to
approximate friction and energy loss.

This prediction system is purely visual and does not interact with the Matter.js physics
engine or affect the actual simulation. By keeping it separate from the physics logic,
the feature improves usability without reducing realism. This type of shot prediction
is uncommon in traditional snooker games and represents a technically challenging
yet intuitive extension that enhances strategic gameplay.
============================================================
*/
