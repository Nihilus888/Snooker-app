// Matter.js aliases
const { Engine, World, Bodies, Body } = Matter;

let engine, world;

let tableLength = 720;
let tableWidth = tableLength / 2;
let ballDiameter = tableWidth / 36;
let pocketDiameter = ballDiameter * 1.5;

// Balls
let balls = [];
let cueBall;

// Table boundaries
let walls = [];

// Cue interaction
let aiming = false;          // false until cue ball placed
let shotPower = 0.02;
let maxPower = 0.06;
let minPower = 0.005;

// Cue ball placement
let placingCueBall = true;
let dZone = {}; // D-zone parameters

function setup() {
  createCanvas(1000, 600);
  engine = Engine.create();
  world = engine.world;
  world.gravity.y = 0; // no gravity

  let tableX = (width - tableLength) / 2;
  let tableY = (height - tableWidth) / 2;

  // Table walls
  walls.push(Bodies.rectangle(tableX + tableLength/2, tableY - 10, tableLength, 20, { isStatic: true }));
  walls.push(Bodies.rectangle(tableX + tableLength/2, tableY + tableWidth + 10, tableLength, 20, { isStatic: true }));
  walls.push(Bodies.rectangle(tableX - 10, tableY + tableWidth/2, 20, tableWidth, { isStatic: true }));
  walls.push(Bodies.rectangle(tableX + tableLength + 10, tableY + tableWidth/2, 20, tableWidth, { isStatic: true }));
  World.add(world, walls);

  // Cue ball which is initially in the D center
  dZone = {
    x: tableX + tableLength * 0.125,
    y: tableY + tableWidth / 2,
    r: tableWidth / 4
  };

  cueBall = Bodies.circle(dZone.x, dZone.y, ballDiameter/2, {
    restitution: 0.9,
    frictionAir: 0.02,
    label: 'cueBall'
  });
  balls.push(cueBall);

  // Pyramid of red balls
  let startX = tableX + tableLength * 0.7;
  let startY = tableY + tableWidth / 2 - 2 * ballDiameter;
  for (let row = 0; row < 5; row++) {
    for (let i = 0; i <= row; i++) {
      let ball = Bodies.circle(startX + row * ballDiameter, startY + (i - row/2) * ballDiameter * 1.9, ballDiameter/2, {
        restitution: 0.9,
        frictionAir: 0.02,
        label: 'red'
      });
      balls.push(ball);
    }
  }

  // Balls that are coloured
  let colorsData = [
    {x: tableX + tableLength * 0.75, y: tableY + tableWidth/2, color: 'blue'},
    {x: tableX + tableLength * 0.875, y: tableY + tableWidth/2 - 2 * ballDiameter, color: 'pink'},
    {x: tableX + tableLength * 0.875, y: tableY + tableWidth/2 + 2 * ballDiameter, color: 'black'},
    {x: tableX + tableLength * 0.75, y: tableY + tableWidth/4, color: 'yellow'},
    {x: tableX + tableLength * 0.75, y: tableY + 3 * tableWidth/4, color: 'green'},
    {x: tableX + tableLength * 0.75, y: tableY + tableWidth/2, color: 'brown'}
  ];

  for (let c of colorsData) {
    let ball = Bodies.circle(c.x, c.y, ballDiameter/2, {
      restitution: 0.9,
      frictionAir: 0.02,
      label: c.color
    });
    balls.push(ball);
  }

  World.add(world, balls);
}

function draw() {
  background(0, 120, 0);
  Engine.update(engine);

  drawTable();
  drawPockets();
  drawDZone();
  drawBalls();

  if (!placingCueBall) drawCue();
  drawPowerBar();

  if (!placingCueBall && !aiming && allBallsStopped()) {
    aiming = true;
  }
}

// Draw table
function drawTable() {
  let tableX = (width - tableLength) / 2;
  let tableY = (height - tableWidth) / 2;

  fill(0, 100, 0);
  stroke(150, 75, 0);
  strokeWeight(20);
  rect(tableX, tableY, tableLength, tableWidth, 20);
}

// Draw pockets
function drawPockets() {
  let tableX = (width - tableLength) / 2;
  let tableY = (height - tableWidth) / 2;
  fill(0);
  noStroke();

  let pockets = [
    [tableX, tableY], [tableX + tableLength / 2, tableY], [tableX + tableLength, tableY],
    [tableX, tableY + tableWidth], [tableX + tableLength / 2, tableY + tableWidth], [tableX + tableLength, tableY + tableWidth]
  ];

  for (let p of pockets) ellipse(p[0], p[1], pocketDiameter);
}

// Draw D-zone
function drawDZone() {
  if (!placingCueBall) return;
  noFill();
  stroke(255, 255, 0);
  strokeWeight(2);
  arc(dZone.x, dZone.y, dZone.r*2, dZone.r*2, PI/2, 3*PI/2);
}

// Draw all balls + pocket detection
function drawBalls() {
  for (let i = balls.length - 1; i >= 0; i--) {
    let b = balls[i];
    fill(getBallColor(b.label));
    ellipse(b.position.x, b.position.y, ballDiameter);

    // Pocket detection
    let tableX = (width - tableLength) / 2;
    let tableY = (height - tableWidth) / 2;
    let pockets = [
      [tableX, tableY], [tableX + tableLength/2, tableY], [tableX + tableLength, tableY],
      [tableX, tableY + tableWidth], [tableX + tableLength/2, tableY + tableWidth], [tableX + tableLength, tableY + tableWidth]
    ];
    for (let p of pockets) {
      if (dist(b.position.x, b.position.y, p[0], p[1]) < pocketDiameter/2) {
        World.remove(world, b);
        balls.splice(i,1);
        break;
      }
    }
  }
}

function getBallColor(label) {
  if (label === 'cueBall') return 'white';
  if (label === 'red') return 'red';
  return label;
}

// Cue drawing
function drawCue() {
  if (!aiming) return;

  let cuePos = cueBall.position;
  let angle = atan2(mouseY - cuePos.y, mouseX - cuePos.x);

  push();
  translate(cuePos.x, cuePos.y);
  rotate(angle);
  stroke(200, 170, 120);
  strokeWeight(6);
  line(-120 - shotPower * 2000, 0, -20, 0);
  pop();
}

// Power bar visualization
function drawPowerBar() {
  fill(255);
  textSize(14);
  text("Power", 20, height - 40);
  noFill();
  stroke(255);
  rect(20, height - 30, 150, 10);
  noStroke();
  fill(255, 0, 0);
  rect(20, height - 30, map(shotPower, minPower, maxPower, 0, 150), 10);
}

// Mouse drag for cue ball placement
function mouseDragged() {
  if (!placingCueBall) return;

  let dx = mouseX - dZone.x;
  let dy = mouseY - dZone.y;
  let distToCenter = sqrt(dx*dx + dy*dy);

  if (distToCenter <= dZone.r) {
    Body.setPosition(cueBall, {x: mouseX, y: mouseY});
  } else {
    let angle = atan2(dy, dx);
    Body.setPosition(cueBall, {x: dZone.x + cos(angle)*dZone.r, y: dZone.y + sin(angle)*dZone.r});
  }
}

// Keyboard controls
function keyPressed() {
  if (placingCueBall) {
    if (key === ' ') {
      placingCueBall = false;
      aiming = true;
    }
  } else {
    if (keyCode === UP_ARROW) shotPower = min(shotPower + 0.005, maxPower);
    if (keyCode === DOWN_ARROW) shotPower = max(shotPower - 0.005, minPower);
    if (key === ' ') strikeCueBall();
  }
}

// Strike cue ball
function strikeCueBall() {
  if (!aiming) return;

  let cuePos = cueBall.position;
  let angle = atan2(mouseY - cuePos.y, mouseX - cuePos.x);
  let force = { x: cos(angle) * shotPower, y: sin(angle) * shotPower };
  Body.applyForce(cueBall, cueBall.position, force);
  aiming = false;
}

// Check if balls are stopped
function allBallsStopped() {
  return balls.every(b => abs(b.velocity.x) < 0.05 && abs(b.velocity.y) < 0.05);
}
