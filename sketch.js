// --- AESTHETIC PALETTES ---
const rawSilkPalette = ["#f4f1eb", "#e8e2d4", "#d1c7b8", "#b8a995", "#9d8f7f"];
const tomatoLeafPalette = [
  "#4c7c54",
  "#5a8c62",
  "#689b70",
  "#76aa7e",
  "#84b98c",
];
const figPalette = ["#7d8f69", "#6b7d57", "#596b45", "#475933", "#354721"];
const bismuthPalette = [
  "#c8b8db",
  "#b8a9d9",
  "#a799d6",
  "#9689d4",
  "#8579d1",
  "#7469ce",
];
const apricityPalette = ["#ffd4a3", "#ffcd91", "#ffc67f", "#ffbf6d", "#ffb85b"];
const personalPalette = ["#ffc0cb", "#ffdab9", "#fdfd96", "#a8d8ea", "#a3b18a"];
const earthyPalette = ["#6d5d4b", "#8e7a65", "#a59481", "#c4b7a6", "#e0d8cd"];

// --- ENHANCED SKETCH 0: BISMUTH CRYSTALLIZATION ---
const sketch0 = (p) => {
  let crystals = [];
  let time = 0;

  class Crystal {
    constructor(x, y, generation = 0) {
      this.center = p.createVector(x, y);
      this.points = [];
      this.color = p.color(p.random(bismuthPalette));
      this.size = p.random(20, 60) * (1 - generation * 0.2);
      this.rotation = p.random(p.TWO_PI);
      this.rotationSpeed = p.random(-0.01, 0.01);
      this.maturity = 0;
      this.generation = generation;
      this.pulsePhase = p.random(p.TWO_PI);
      this.generatePoints();
    }

    generatePoints() {
      const layers = p.floor(p.random(3, 7));
      for (let layer = 0; layer < layers; layer++) {
        const layerRadius = (layer + 1) * (this.size / layers);
        const sides = p.floor(p.random(4, 8));
        const layerPoints = [];

        for (let i = 0; i < sides; i++) {
          const angle = (p.TWO_PI * i) / sides + this.rotation;
          const x = p.cos(angle) * layerRadius;
          const y = p.sin(angle) * layerRadius;
          layerPoints.push(p.createVector(x, y));
        }
        this.points.push(layerPoints);
      }
    }

    update() {
      if (this.maturity < 1) this.maturity += 0.005;
      this.rotation += this.rotationSpeed;
      this.pulsePhase += 0.02;

      if (this.maturity > 0.8 && p.random() > 0.998 && this.generation < 2) {
        let angle = p.random(p.TWO_PI);
        let distance = this.size * 1.5;
        let childX = this.center.x + p.cos(angle) * distance;
        let childY = this.center.y + p.sin(angle) * distance;

        if (childX > 0 && childX < p.width && childY > 0 && childY < p.height) {
          crystals.push(new Crystal(childX, childY, this.generation + 1));
        }
      }
    }

    display() {
      p.push();
      p.translate(this.center.x, this.center.y);
      p.rotate(this.rotation);

      const currentMaturity = Math.min(this.maturity, 1);
      const pulse = 1 + p.sin(this.pulsePhase) * 0.1;

      for (let layer = 0; layer < this.points.length; layer++) {
        const layerPoints = this.points[layer];
        const alpha = p.map(layer, 0, this.points.length - 1, 200, 60);

        let tempColor = p.color(this.color.toString());
        tempColor.setAlpha(alpha * currentMaturity);

        p.fill(tempColor);
        p.stroke(255, alpha * 0.4 * currentMaturity);
        p.strokeWeight(0.8);

        p.beginShape();
        for (let point of layerPoints) {
          const scaledPoint = p5.Vector.mult(point, currentMaturity * pulse);
          p.vertex(scaledPoint.x, scaledPoint.y);
        }
        p.endShape(p.CLOSE);

        if (p.random() > 0.95) {
          const randomPoint = p.random(layerPoints);
          const scaledPoint = p5.Vector.mult(
            randomPoint,
            currentMaturity * pulse
          );
          p.fill(255, 200 * currentMaturity);
          p.noStroke();
          p.circle(scaledPoint.x, scaledPoint.y, p.random(2, 5));
        }
      }
      p.pop();
    }
  }

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.RGB);
    for (let i = 0; i < 3; i++) {
      crystals.push(
        new Crystal(
          p.random(p.width * 0.2, p.width * 0.8),
          p.random(p.height * 0.2, p.height * 0.8)
        )
      );
    }
  };

  p.draw = () => {
    p.background(5, 8, 12);
    time += 0.01;

    for (let i = 0; i < 3; i++) {
      p.stroke(p.random(bismuthPalette));
      p.strokeWeight(0.3);
      let x1 = p.noise(time * 0.1 + i) * p.width;
      let y1 = p.noise(time * 0.1 + i + 100) * p.height;
      let x2 = p.noise(time * 0.1 + i + 200) * p.width;
      let y2 = p.noise(time * 0.1 + i + 300) * p.height;
      p.line(x1, y1, x2, y2);
    }

    for (let crystal of crystals) {
      crystal.update();
      crystal.display();
    }

    crystals = crystals.filter((crystal) => crystal.maturity < 5);
  };

  p.mousePressed = () => {
    if (p.mouseButton === p.LEFT)
      crystals.push(new Crystal(p.mouseX, p.mouseY));
    if (p.mouseButton === p.RIGHT)
      crystals = crystals.filter((c) => c.generation === 0 && c.maturity < 0.5);
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
};

// --- SKETCH 1: VERLET CLOTH ---
const sketch1 = (p) => {
  class Point {
    constructor(x, y) {
      this.pos = p.createVector(x, y);
      this.prevPos = p.createVector(x, y);
      this.acc = p.createVector(0, 0);
      this.isPinned = false;
    }
    update(gravity) {
      if (this.isPinned) return;
      let vel = p5.Vector.sub(this.pos, this.prevPos);
      vel.mult(0.99);
      this.prevPos.set(this.pos);
      let newPos = p5.Vector.add(this.pos, vel);
      newPos.add(this.acc);
      newPos.add(gravity);
      this.pos.set(newPos);
      this.acc.mult(0);
    }
    constrain() {
      if (this.isPinned) return;
      if (this.pos.y > p.height) this.pos.y = p.height;
      if (this.pos.x < 0) this.pos.x = 0;
      if (this.pos.x > p.width) this.pos.x = p.width;
    }
  }
  class Stick {
    constructor(p1, p2) {
      this.p1 = p1;
      this.p2 = p2;
      this.length = p5.Vector.dist(p1.pos, p2.pos);
    }
    update() {
      const diff = p5.Vector.sub(this.p1.pos, this.p2.pos);
      const dist = diff.mag();
      if (dist === 0) return;
      const diffRatio = (this.length - dist) / dist / 2;
      const offset = diff.mult(diffRatio);
      if (!this.p1.isPinned) {
        this.p1.pos.add(offset);
      }
      if (!this.p2.isPinned) {
        this.p2.pos.sub(offset);
      }
    }
    display() {
      p.stroke(244, 241, 235, 180);
      p.strokeWeight(1);
      p.line(this.p1.pos.x, this.p1.pos.y, this.p2.pos.x, this.p2.pos.y);
    }
  }
  let points = [],
    sticks = [];
  const gravity = new p5.Vector(0, 0.5),
    physicsAccuracy = 5;
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    points = [];
    sticks = [];
    const cols = 40,
      rows = 25,
      spacing = 20;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let px = p.width / 2 - (cols * spacing) / 2 + x * spacing,
          py = 50 + y * spacing,
          point = new Point(px, py);
        if (y === 0) {
          point.isPinned = true;
        }
        points.push(point);
        if (x > 0) {
          sticks.push(new Stick(point, points[points.length - 2]));
        }
        if (y > 0) {
          sticks.push(new Stick(point, points[points.length - 1 - cols]));
        }
      }
    }
  };
  p.draw = () => {
    p.background(10, 10, 10);
    for (const point of points) {
      point.update(gravity);
    }
    for (let i = 0; i < physicsAccuracy; i++) {
      for (const stick of sticks) {
        stick.update();
      }
      for (const point of points) {
        point.constrain();
      }
    }
    if (p.mouseIsPressed) {
      const mouseVec = p.createVector(p.mouseX, p.mouseY);
      if (p.mouseButton === p.LEFT) {
        const prevMouseVec = p.createVector(p.pmouseX, p.pmouseY),
          mouseVel = p5.Vector.sub(mouseVec, prevMouseVec);
        mouseVel.mult(0.5);
        for (const point of points) {
          if (p5.Vector.dist(point.pos, mouseVec) < 30) {
            point.prevPos.sub(mouseVel);
          }
        }
      }
      if (p.mouseButton === p.RIGHT) {
        for (let i = sticks.length - 1; i >= 0; i--) {
          if (
            p5.Vector.dist(sticks[i].p1.pos, mouseVec) < 20 ||
            p5.Vector.dist(sticks[i].p2.pos, mouseVec) < 20
          ) {
            sticks.splice(i, 1);
          }
        }
      }
    }
    for (const stick of sticks) {
      stick.display();
    }
  };
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.setup();
  };
};

// --- SKETCH 2: FLOW FIELD ---
const sketch2 = (p) => {
  let particles = [],
    timeOffset = 0;
  class Particle {
    constructor() {
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.vel = p.createVector(0, 0);
      this.acc = p.createVector(0, 0);
      this.maxSpeed = 2;
      this.color = p.color(p.random(personalPalette));
      this.color.setAlpha(200);
      this.prevPos = this.pos.copy();
    }
    update() {
      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed);
      this.pos.add(this.vel);
      this.acc.mult(0);
    }
    applyForce(force) {
      this.acc.add(force);
    }
    follow(flowFieldAngle) {
      let force = p5.Vector.fromAngle(flowFieldAngle);
      force.setMag(0.1);
      this.applyForce(force);
    }
    display() {
      p.stroke(this.color);
      p.strokeWeight(1.5);
      p.line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
      this.updatePrev();
    }
    updatePrev() {
      this.prevPos.x = this.pos.x;
      this.prevPos.y = this.pos.y;
    }
    edges() {
      if (this.pos.x > p.width) {
        this.pos.x = 0;
        this.updatePrev();
      }
      if (this.pos.x < 0) {
        this.pos.x = p.width;
        this.updatePrev();
      }
      if (this.pos.y > p.height) {
        this.pos.y = 0;
        this.updatePrev();
      }
      if (this.pos.y < 0) {
        this.pos.y = p.height;
        this.updatePrev();
      }
    }
  }
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.background("#0a0a0a");
    for (let i = 0; i < 500; i++) {
      particles.push(new Particle());
    }
  };
  p.draw = () => {
    p.background(10, 10, 10, 8);
    const noiseScale = 0.005;
    for (let particle of particles) {
      let angle =
        p.noise(
          particle.pos.x * noiseScale,
          particle.pos.y * noiseScale,
          timeOffset
        ) *
        p.TWO_PI *
        2;
      particle.follow(angle);
      particle.update();
      particle.edges();
      particle.display();
    }
    timeOffset += 0.0005;
  };
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.background("#0a0a0a");
    particles = [];
    for (let i = 0; i < 500; i++) {
      particles.push(new Particle());
    }
  };
};

// --- SKETCH 3: CONWAY'S GAME OF LIFE ---
const sketch3 = (p) => {
  let grid,
    cols,
    rows,
    resolution = 10,
    isPlaying = false;
  function make2DArray(c, r) {
    let arr = new Array(c);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = new Array(r);
    }
    return arr;
  }
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    cols = p.floor(p.width / resolution);
    rows = p.floor(p.height / resolution);
    grid = make2DArray(cols, rows);
    p.resetGrid();
  };
  p.resetGrid = () => {
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        grid[i][j] = 0;
      }
    }
  };
  p.draw = () => {
    p.background(10, 10, 10);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let x = i * resolution,
          y = j * resolution;
        if (grid[i][j] == 1) {
          p.fill(244, 241, 235);
          p.noStroke();
          p.rect(x, y, resolution - 1, resolution - 1);
        }
      }
    }
    if (isPlaying) {
      p.computeNextGeneration();
    }
  };
  p.computeNextGeneration = () => {
    let next = make2DArray(cols, rows);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let state = grid[i][j],
          neighbors = p.countNeighbors(i, j);
        if (state == 0 && neighbors == 3) {
          next[i][j] = 1;
        } else if (state == 1 && (neighbors < 2 || neighbors > 3)) {
          next[i][j] = 0;
        } else {
          next[i][j] = state;
        }
      }
    }
    grid = next;
  };
  p.countNeighbors = (x, y) => {
    let sum = 0;
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        sum += grid[(x + i + cols) % cols][(y + j + rows) % rows];
      }
    }
    sum -= grid[x][y];
    return sum;
  };
  p.mousePressed = () => {
    if (
      p.mouseButton === p.LEFT &&
      p.mouseX > 0 &&
      p.mouseX < p.width &&
      p.mouseY > 0 &&
      p.mouseY < p.height
    ) {
      let col = p.floor(p.mouseX / resolution),
        row = p.floor(p.mouseY / resolution);
      grid[col][row] = grid[col][row] === 0 ? 1 : 0;
    }
  };
  p.mouseDragged = () => {
    if (
      p.mouseButton === p.LEFT &&
      p.mouseX > 0 &&
      p.mouseX < p.width &&
      p.mouseY > 0 &&
      p.mouseY < p.height
    ) {
      let col = p.floor(p.mouseX / resolution),
        row = p.floor(p.mouseY / resolution);
      grid[col][row] = 1;
    }
  };
  p.keyPressed = () => {
    if (p.key === " ") {
      isPlaying = !isPlaying;
    }
    if (p.key === "r" || p.key === "R") {
      p.resetGrid();
      isPlaying = false;
    }
  };
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.setup();
  };
};

// --- SKETCH 5: TYPOGRAPHIC DYNAMICS ---
const sketch5 = (p) => {
  let characters = [];
  class Character {
    constructor(char, x, y) {
      this.char = char;
      this.pos = p.createVector(x, y);
      this.target = p.createVector(x, y);
      this.vel = p.createVector();
      this.acc = p.createVector();
      this.maxSpeed = 10;
      this.maxForce = 1;
    }
    behaviors() {
      let seek = this.arrive(this.target),
        mouse = p.createVector(p.mouseX, p.mouseY),
        flee = this.flee(mouse);
      seek.mult(0.2);
      flee.mult(5);
      this.applyForce(seek);
      this.applyForce(flee);
    }
    applyForce(f) {
      this.acc.add(f);
    }
    update() {
      this.pos.add(this.vel);
      this.vel.add(this.acc);
      this.acc.mult(0);
    }
    display() {
      p.text(this.char, this.pos.x, this.pos.y);
    }
    arrive(target) {
      let desired = p5.Vector.sub(target, this.pos),
        d = desired.mag(),
        speed = this.maxSpeed;
      if (d < 100) {
        speed = p.map(d, 0, 100, 0, this.maxSpeed);
      }
      desired.setMag(speed);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce);
      return steer;
    }
    flee(target) {
      let desired = p5.Vector.sub(target, this.pos),
        d = desired.mag();
      if (d < 50) {
        desired.setMag(this.maxSpeed);
        desired.mult(-1);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
      } else {
        return p.createVector(0, 0);
      }
    }
  }
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.fill(51, 51, 51);
    let spacing = 30;
    characters = [];
    for (let x = 0; x < p.width; x += spacing) {
      for (let y = 0; y < p.height; y += spacing) {
        let char = p.random() > 0.5 ? "?" : "!";
        characters.push(new Character(char, x, y));
      }
    }
  };
  p.draw = () => {
    p.background(244, 241, 235);
    for (let char of characters) {
      char.behaviors();
      char.update();
      char.display();
    }
  };
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.setup();
  };
};

// --- SKETCH 6: PARTICLE ADVECTION ---
const sketch6 = (p) => {
  let particles = [];
  const numParticles = 1500;
  let time = 0;
  const fireflyPalette = ["#fdfd96", "#ffdab9"];
  class AdvectionParticle {
    constructor() {
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.vel = p.createVector(0, 0);
      this.lifespan = p.random(100, 255);
      this.color = p.color(p.random(fireflyPalette));
    }
    update(noiseScale, noiseStrength) {
      let angle =
        p.noise(this.pos.x * noiseScale, this.pos.y * noiseScale, time) *
        p.TWO_PI *
        4;
      let force = p5.Vector.fromAngle(angle);
      force.mult(noiseStrength);
      let mouse = p.createVector(p.mouseX, p.mouseY),
        toMouse = p5.Vector.sub(this.pos, mouse),
        dist = toMouse.mag();
      if (dist < 100) {
        let mouseForce = toMouse
          .copy()
          .normalize()
          .mult(p.map(dist, 0, 100, 5, 0));
        force.add(mouseForce);
      }
      this.vel.add(force);
      this.vel.limit(4);
      this.pos.add(this.vel);
      this.vel.mult(0.95);
      this.lifespan -= 0.5;
    }
    display() {
      this.color.setAlpha(this.lifespan);
      p.stroke(this.color);
      p.point(this.pos.x, this.pos.y);
    }
    respawn() {
      if (this.lifespan < 0) {
        this.pos = p.createVector(p.random(p.width), p.random(p.height));
        this.lifespan = 255;
      }
    }
  }
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.strokeWeight(3);
    for (let i = 0; i < numParticles; i++) {
      particles.push(new AdvectionParticle());
    }
    p.background(10, 10, 10);
  };
  p.draw = () => {
    p.background(10, 10, 10, 50);
    time += 0.005;
    for (let particle of particles) {
      particle.update(0.005, 0.1);
      particle.respawn();
      particle.display();
    }
  };
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    particles = [];
    for (let i = 0; i < numParticles; i++) {
      particles.push(new AdvectionParticle());
    }
    p.background(10, 10, 10);
  };
};

// --- SKETCH 7: LIQUID MIRROR ---
const sketch7 = (p) => {
  let grid = [],
    cols,
    rows,
    spacing = 15;
  class GridPoint {
    constructor(x, y) {
      this.originalPos = p.createVector(x, y);
      this.pos = p.createVector(x, y);
      this.vel = p.createVector();
    }
    update() {
      let mouse = p.createVector(p.mouseX, p.mouseY),
        toMouse = p5.Vector.sub(mouse, this.pos),
        dist = toMouse.mag(),
        force = p.createVector();
      if (dist < 150) {
        let repel = toMouse.copy();
        repel.normalize();
        repel.mult(-1);
        let strength = p.map(dist, 0, 150, 15, 0);
        repel.mult(strength);
        force.add(repel);
      }
      let toOriginal = p5.Vector.sub(this.originalPos, this.pos);
      toOriginal.mult(0.1);
      force.add(toOriginal);
      this.vel.add(force);
      this.vel.mult(0.85);
      this.pos.add(this.vel);
    }
  }
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    cols = p.floor(p.width / spacing) + 2;
    rows = p.floor(p.height / spacing) + 2;
    grid = [];
    for (let i = 0; i < cols; i++) {
      grid[i] = [];
      for (let j = 0; j < rows; j++) {
        grid[i][j] = new GridPoint(
          i * spacing - spacing / 2,
          j * spacing - spacing / 2
        );
      }
    }
  };
  p.draw = () => {
    p.background(10, 10, 10);
    p.noStroke();
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        grid[i][j].update();
      }
    }
    for (let i = 0; i < cols - 1; i++) {
      for (let j = 0; j < rows - 1; j++) {
        let p1 = grid[i][j].pos,
          p2 = grid[i + 1][j].pos,
          p3 = grid[i + 1][j + 1].pos,
          p4 = grid[i][j + 1].pos,
          v1 = p5.Vector.sub(p2, p1),
          v2 = p5.Vector.sub(p4, p1),
          normal = v1.cross(v2),
          brightness = p.map(normal.z, -100, 100, 20, 255);
        p.fill(brightness);
        p.quad(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
      }
    }
  };
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.setup();
  };
};

// --- SKETCH 8: SELENIUM PHOTOCONDUCTIVE FIELD ---
const sketch8 = (p) => {
  let nodes = [],
    connections = [],
    lightSources = [],
    nodeSpacing = 25;
  class PhotoNode {
    constructor(x, y) {
      this.pos = p.createVector(x, y);
      this.basePos = p.createVector(x, y);
      this.conductivity = 0;
      this.maxConductivity = 0;
      this.lightLevel = 0;
      this.pulsePhase = p.random(p.TWO_PI);
      this.neighbors = [];
      this.vibration = p.createVector();
    }
    update() {
      let totalLight = this.calculateLightFrom(p.mouseX, p.mouseY, 120);
      for (let source of lightSources) {
        totalLight += this.calculateLightFrom(
          source.x,
          source.y,
          source.intensity
        );
      }
      this.lightLevel = p.constrain(totalLight, 0, 1);
      let targetConductivity = p.pow(this.lightLevel, 0.3) * 255;
      this.conductivity = p.lerp(this.conductivity, targetConductivity, 0.1);
      this.maxConductivity = p.max(
        this.maxConductivity * 0.995,
        this.conductivity
      );
      this.pulsePhase += 0.05 + this.conductivity * 0.001;
      this.vibration.set(
        p.sin(this.pulsePhase) * this.conductivity * 0.02,
        p.cos(this.pulsePhase * 1.3) * this.conductivity * 0.02
      );
      this.pos = p5.Vector.add(this.basePos, this.vibration);
    }
    calculateLightFrom(x, y, maxDistance) {
      let distance = p.dist(this.pos.x, this.pos.y, x, y);
      return distance > maxDistance ? 0 : p.map(distance, 0, maxDistance, 1, 0);
    }
    display() {
      let alpha = p.map(this.conductivity, 0, 255, 20, 200),
        size = p.map(this.conductivity, 0, 255, 2, 8),
        r = p.map(this.conductivity, 0, 255, 80, 255),
        g = p.map(this.conductivity, 0, 255, 80, 200),
        b = p.map(this.conductivity, 0, 255, 80, 100);
      p.fill(r, g, b, alpha);
      p.noStroke();
      p.circle(this.pos.x, this.pos.y, size);
      if (this.maxConductivity > 50) {
        p.fill(r, g, b, 30);
        p.circle(this.pos.x, this.pos.y, size * 2);
      }
    }
  }
  class Connection {
    constructor(node1, node2) {
      this.node1 = node1;
      this.node2 = node2;
      this.strength = 0;
    }
    update() {
      this.strength = (this.node1.conductivity + this.node2.conductivity) / 2;
    }
    display() {
      if (this.strength < 10) return;
      let alpha = p.map(this.strength, 0, 255, 0, 150),
        weight = p.map(this.strength, 0, 255, 0.5, 3);
      p.stroke(255, 220, 150, alpha);
      p.strokeWeight(weight);
      p.line(
        this.node1.pos.x,
        this.node1.pos.y,
        this.node2.pos.x,
        this.node2.pos.y
      );
      if (this.strength > 100) {
        let flowPos = (p.sin(p.frameCount * 0.1) + 1) * 0.5,
          flowX = p.lerp(this.node1.pos.x, this.node2.pos.x, flowPos),
          flowY = p.lerp(this.node1.pos.y, this.node2.pos.y, flowPos);
        p.fill(255, 255, 200);
        p.noStroke();
        p.circle(flowX, flowY, 4);
      }
    }
  }
  class LightSource {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.intensity = 80;
      this.life = 300;
    }
    update() {
      this.life--;
      this.intensity *= 0.998;
    }
    display() {
      let alpha = p.map(this.life, 0, 300, 0, 100);
      p.fill(255, 255, 200, alpha);
      p.noStroke();
      p.circle(this.x, this.y, this.intensity * 0.5);
    }
    isDead() {
      return this.life <= 0;
    }
  }
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    let cols = p.floor(p.width / nodeSpacing),
      rows = p.floor(p.height / nodeSpacing);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        nodes.push(
          new PhotoNode(
            i * nodeSpacing + nodeSpacing / 2,
            j * nodeSpacing + nodeSpacing / 2
          )
        );
      }
    }
    for (let node of nodes) {
      for (let other of nodes) {
        let distance = p5.Vector.dist(node.pos, other.pos);
        if (distance > 0 && distance < nodeSpacing * 1.5) {
          connections.push(new Connection(node, other));
        }
      }
    }
  };
  p.draw = () => {
    p.background(15, 20, 25);
    for (let connection of connections) {
      connection.update();
      connection.display();
    }
    for (let node of nodes) {
      node.update();
      node.display();
    }
    for (let i = lightSources.length - 1; i >= 0; i--) {
      lightSources[i].update();
      lightSources[i].display();
      if (lightSources[i].isDead()) {
        lightSources.splice(i, 1);
      }
    }
    p.fill(255, 255, 200, 50);
    p.noStroke();
    p.circle(p.mouseX, p.mouseY, 240);
  };
  p.mousePressed = () => lightSources.push(new LightSource(p.mouseX, p.mouseY));
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    nodes = [];
    connections = [];
    lightSources = [];
    p.setup();
  };
};

// --- SKETCH 9: BREATHING GRID ---
const sketch9 = (p) => {
  let cells = [],
    spacing = 30,
    time = 0;
  class Cell {
    constructor(x, y) {
      this.pos = p.createVector(x, y);
      this.noiseOffset = p.createVector(p.random(1000), p.random(1000));
    }
    display(time) {
      let mouseInfluence = p.map(
        p.dist(p.mouseX, p.mouseY, this.pos.x, this.pos.y),
        0,
        300,
        2,
        0.5
      );
      mouseInfluence = p.constrain(mouseInfluence, 0.5, 2);
      let n = p.noise(
        this.pos.x * 0.01 + time,
        this.pos.y * 0.01 + time,
        this.noiseOffset.x
      );
      let radius = p.map(n, 0, 1, 0, spacing * 1.5 * mouseInfluence);
      p.stroke(224, 216, 205);
      p.strokeWeight(1.5);
      p.noFill();
      p.circle(this.pos.x, this.pos.y, radius);
    }
  }
  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    cells = [];
    let startX = (p.width % spacing) / 2,
      startY = (p.height % spacing) / 2;
    for (let x = startX; x < p.width; x += spacing) {
      for (let y = startY; y < p.height; y += spacing) {
        cells.push(new Cell(x, y));
      }
    }
  };
  p.draw = () => {
    p.background(25, 22, 20);
    for (let cell of cells) {
      cell.display(time);
    }
    time += 0.005;
  };
  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.setup();
  };
};

// --- GALLERY SETUP AND NAVIGATION ---
document.addEventListener("DOMContentLoaded", () => {
  // --- INSTANTIATE SKETCHES ---
  new p5(sketch0, "sketch0-container");
  new p5(sketch1, "sketch1-container");
  new p5(sketch2, "sketch2-container");
  new p5(sketch3, "sketch3-container");
  new p5(sketch5, "sketch5-container");
  new p5(sketch6, "sketch6-container");
  new p5(sketch7, "sketch7-container");
  new p5(sketch8, "sketch8-container");
  new p5(sketch9, "sketch9-container");
  new p5(sketch10, "sketch10-container");
  new p5(sketch11, "sketch11-container");

  // Enhanced navigation
  const sections = document.querySelectorAll("section");
  const navDots = document.querySelectorAll(".nav-dot");

  navDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      if (sections[index])
        sections[index].scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = Array.from(sections).indexOf(entry.target);
          navDots.forEach((dot) => dot.classList.remove("active"));
          if (navDots[index]) navDots[index].classList.add("active");
        }
      });
    },
    { threshold: 0.3, rootMargin: "-10% 0px -10% 0px" }
  );

  sections.forEach((section) => observer.observe(section));

  document.addEventListener("keydown", (e) => {
    let currentActive = document.querySelector(".nav-dot.active");
    let currentIndex = Array.from(navDots).indexOf(currentActive);
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      let nextIndex = Math.min(currentIndex + 1, sections.length - 1);
      if (sections[nextIndex])
        sections[nextIndex].scrollIntoView({ behavior: "smooth" });
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      let prevIndex = Math.max(currentIndex - 1, 0);
      if (sections[prevIndex])
        sections[prevIndex].scrollIntoView({ behavior: "smooth" });
    }
  });

  // --- SKETCH 10: ASCII SYNTHESIS ---
  const sketch10 = (p) => {
    let asciiArt;
    const density = "Ñ@#W$9876543210?!abc;:+=-,._ ";

    class AsciiArt {
      constructor() {
        this.charSize = 12;
        this.cols = p.floor(p.width / this.charSize);
        this.rows = p.floor(p.height / this.charSize);
        this.brightnessGrid = Array(this.cols)
          .fill(0)
          .map(() => Array(this.rows).fill(0));
        this.generatePearBrightness();
      }

      generatePearBrightness() {
        for (let i = 0; i < this.cols; i++) {
          for (let j = 0; j < this.rows; j++) {
            // Convert grid coords to normalized canvas space [-1, 1]
            let x = p.map(i, 0, this.cols, -1.2, 1.2);
            let y = p.map(j, 0, this.rows, -1.2, 1.2);

            // Pear shape using implicit equations
            let pearBody = p.sqrt(x * x + p.pow(y - 0.1, 2));
            let bodyShape = 1 - p.smoothstep(0.45, 0.5, pearBody);

            let pearTop = p.sqrt(p.pow(x * 0.7, 2) + p.pow(y - 0.6, 2));
            let topShape = 1 - p.smoothstep(0.2, 0.25, pearTop);

            let stem = p.abs(x) < 0.05 && y > 0.6 && y < 1.0 ? 1 : 0;

            let combinedShape = p.max(bodyShape, topShape);

            // Add some noise for texture
            let noiseVal = p.noise(i * 0.1, j * 0.1);
            let brightness = p.constrain(
              combinedShape * 255 - noiseVal * 50,
              0,
              255
            );

            this.brightnessGrid[i][j] = p.max(brightness, stem * 150);
          }
        }
      }

      display() {
        for (let i = 0; i < this.cols; i++) {
          for (let j = 0; j < this.rows; j++) {
            let brightness = this.brightnessGrid[i][j];
            if (brightness > 0) {
              let densityMap = p.map(
                p.mouseX,
                0,
                p.width,
                0,
                density.length - 1,
                true
              );
              let charIndex = p.floor(
                p.map(brightness, 0, 255, densityMap, 0, true)
              );

              let char = density.charAt(charIndex);

              p.fill(30, p.map(brightness, 0, 255, 100, 255));
              p.text(char, i * this.charSize, j * this.charSize);
            }
          }
        }
      }
    }

    p.setup = () => {
      let container = document.getElementById("sketch10-container");
      p.createCanvas(container.offsetWidth, container.offsetHeight).parent(
        container
      );

      p.textFont("monospace");
      p.textSize(12);
      p.textAlign(p.LEFT, p.TOP);
      p.noStroke();
      asciiArt = new AsciiArt();
    };

    p.draw = () => {
      p.background(244, 241, 235); // Match section background
      asciiArt.display();
    };

    p.windowResized = () => {
      let container = document.getElementById("sketch10-container");
      p.resizeCanvas(container.offsetWidth, container.offsetHeight);
      asciiArt = new AsciiArt();
    };
  };

  // --- SKETCH 11: GENERATIVE EMBROIDERY ---
  const sketch11 = (p) => {
    let lastPos;
    let paperTexture;
    const stitchSpacing = 15;
    const threadPalette = [
      "#4a7c59",
      "#c44536",
      "#7a6c5d",
      "#e8c547",
      "#3066be",
    ];
    let currentThreadColor;

    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight).parent(
        "sketch11-container"
      ); // This is the fix
      paperTexture = createPaperTexture(p);
      p.image(paperTexture, 0, 0);
      lastPos = p.createVector(0, 0);
      currentThreadColor = p.color(p.random(threadPalette));
      currentThreadColor.setAlpha(200);
    };

    p.draw = () => {
      let currentPos = p.createVector(p.mouseX, p.mouseY);

      if (
        p.dist(currentPos.x, currentPos.y, lastPos.x, lastPos.y) > stitchSpacing
      ) {
        drawStitch(p, currentPos.x, currentPos.y);
        lastPos = currentPos;

        // Occasionally change thread color
        if (p.random() > 0.98) {
          currentThreadColor = p.color(p.random(threadPalette));
          currentThreadColor.setAlpha(200);
        }
      }
    };

    function drawStitch(p, x, y) {
      let stitchSize = p.random(8, 12);
      let angle = p.random(p.TWO_PI);
      let patternType = p.floor(p.random(3));

      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.stroke(currentThreadColor);
      p.strokeWeight(p.random(1.5, 2.5));

      if (patternType === 0) {
        // Simple X
        p.line(-stitchSize, -stitchSize, stitchSize, stitchSize);
        p.line(-stitchSize, stitchSize, stitchSize, -stitchSize);
      } else if (patternType === 1) {
        // Asterisk
        p.line(-stitchSize, -stitchSize, stitchSize, stitchSize);
        p.line(-stitchSize, stitchSize, stitchSize, -stitchSize);
        p.line(0, -stitchSize * 1.2, 0, stitchSize * 1.2);
        p.line(-stitchSize * 1.2, 0, stitchSize * 1.2, 0);
      } else {
        // Square stitch
        p.noFill();
        p.rect(-stitchSize / 2, -stitchSize / 2, stitchSize, stitchSize);
        p.line(-stitchSize, -stitchSize, stitchSize, stitchSize);
        p.line(-stitchSize, stitchSize, stitchSize, -stitchSize);
      }

      p.pop();
    }

    function createPaperTexture(p) {
      let texture = p.createGraphics(p.width, p.height);
      texture.background(233, 228, 217); // Base paper color from CSS
      texture.loadPixels();
      for (let i = 0; i < texture.width * texture.height * 4; i += 4) {
        let grain = p.random(-15, 15);
        texture.pixels[i] += grain;
        texture.pixels[i + 1] += grain;
        texture.pixels[i + 2] += grain;
      }
      texture.updatePixels();
      return texture;
    }

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      paperTexture = createPaperTexture(p);
      p.image(paperTexture, 0, 0); // Redraw background
    };
  };

  // Disable right-click context menu
  document.addEventListener("contextmenu", (event) => event.preventDefault());
});
