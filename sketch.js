let bgmusic;
let hoversound;
let click;
let lastHover = 0;
let bg; 

let echoImg;
let introStartTime = 0;
let holdDuration = 3000; 
let animDuration = 4000;

let about;
let isAboutOpen = false;
let aboutAnimStartTime = 0;

let instructionsImg;
let isInstructionsOpen = false;
let instructionsAnimStartTime = 0;

let isSettingsOpen = false;
let bgMusicVol = 0.5;
let sfxVol = 0.5;
let micThreshold = 0.05;
let draggingSlider = null; 

let mic;
let micCooldown = 0;
let isJournalActive = false;

let activeClouds = [];

function preload() {
  bgmusic = loadSound('bgmusic.mp3');
  hoversound = loadSound('hover.mp3');
  click = loadSound('click.mp3');
  about = loadImage('about.png');
  instructionsImg = loadImage('instructions.png');
  echoImg = loadImage('echojournal.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  introStartTime = millis(); 
  
  if (bgmusic) {
    bgmusic.loop();
    bgmusic.setVolume(bgMusicVol);
  }
  if (hoversound) hoversound.setVolume(sfxVol);
  if (click) click.setVolume(sfxVol);

  mic = new p5.AudioIn();

  bg = createGraphics(windowWidth, windowHeight);
  resetPaperCanvas();
}

function resetPaperCanvas() {
  isJournalActive = false;
  activeClouds = [];

  bg.background(244, 244, 246);
  bg.noStroke();

  for (let i = 0; i < 90000; i++) {
    let x = random(width);
    let y = random(height);
    let n = noise(x * 0.008, y * 0.008);
    let c = random(100) > 45 ? 255 : 30; 
    let size = random() < 0.85 ? random(1, 2) : random(2.5, 4.5); 
    
    bg.stroke(c, random(5, 25) * n); 
    bg.strokeWeight(size);
    bg.point(x, y);
  }

  for (let i = 0; i < 1500; i++) {
    let x = random(width);
    let y = random(height);
    let len = random(3, 8);
    let angle = random(TWO_PI);

    bg.stroke(random(100) > 50 ? 255 : 40, random(10, 30));
    bg.strokeWeight(random(0.5, 1.5));
    bg.line(x, y, x + cos(angle) * len, y + sin(angle) * len);
  }

  bg.push();
  bg.translate(width / 2, height / 2);
  
  let paperW = 1000;
  let paperH = 650;

  bg.rectMode(CENTER);
  bg.noStroke();
  bg.fill(0, 0, 0, 12);
  bg.rect(6, 10, paperW, paperH, 4);
  bg.fill(0, 0, 0, 6);
  bg.rect(12, 18, paperW, paperH, 8);

  bg.fill(255, 253, 208);
  bg.rect(0, 0, paperW, paperH, 2);

  let areaRatio = (paperW * paperH) / (width * height);
  let paperPoints = int(90000 * areaRatio);
  let paperLines = int(1500 * areaRatio);

  for (let i = 0; i < paperPoints; i++) {
    let px = random(-paperW / 2, paperW / 2);
    let py = random(-paperH / 2, paperH / 2);
    let n = noise((px + width / 2) * 0.008, (py + height / 2) * 0.008);
    let c = random(100) > 45 ? 255 : 30; 
    let size = random() < 0.85 ? random(1, 2) : random(2.5, 4.5); 
    
    bg.stroke(c, random(5, 25) * n); 
    bg.strokeWeight(size);
    bg.point(px, py);
  }

  for (let i = 0; i < paperLines; i++) {
    let px = random(-paperW / 2, paperW / 2);
    let py = random(-paperH / 2, paperH / 2);
    let len = random(3, 8);
    let angle = random(TWO_PI);

    bg.stroke(random(100) > 50 ? 255 : 40, random(10, 30));
    bg.strokeWeight(random(0.5, 1.5));
    bg.line(px, py, px + cos(angle) * len, py + sin(angle) * len);
  }
  bg.pop();
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function draw() {
  background(244, 244, 246);

  if (bgmusic) bgmusic.setVolume(bgMusicVol);
  if (hoversound) hoversound.setVolume(sfxVol);
  if (click) click.setVolume(sfxVol);

  let elapsed = millis() - introStartTime;
  let moveProgress = 0;
  let fadeAlpha = 0; 

  if (elapsed < holdDuration) {
    moveProgress = 0;
    fadeAlpha = 0;
  } else if (elapsed < holdDuration + animDuration) {
    let rawT = (elapsed - holdDuration) / animDuration;
    moveProgress = easeInOutCubic(rawT);
    fadeAlpha = moveProgress * 255;
  } else {
    moveProgress = 1;
    fadeAlpha = 255;
  }

  // Calculate vertical offset (slides elements up into position)
  let slideDistance = 70; // Adjust distance to slide
  let yOffset = (1 - moveProgress) * slideDistance;

  // Render Background Canvas (Fades in + Slides from below)
  if (fadeAlpha > 0) {
    push();
    tint(255, fadeAlpha);
    image(bg, 0, yOffset);
    pop();
  }

  if (isJournalActive && mic && fadeAlpha === 255) {
    let vol = mic.getLevel();
    if (vol > micThreshold && micCooldown <= 0) {
      generateMicCloud();
      micCooldown = 8;
    }
  }
  if (micCooldown > 0) micCooldown--;

  // Active Clouds (Fade in + Slide from below)
  if (fadeAlpha > 0) {
    blendMode(MULTIPLY);
    for (let i = activeClouds.length - 1; i >= 0; i--) {
      let c = activeClouds[i];
      c.life--;

      let progress = c.life / c.maxLife; 
      let currentScale = map(progress, 1, 0, 0.7, 0.0); 
      let currentAlpha = map(progress, 1, 0, 240, 0) * (fadeAlpha / 255);   

      push();
      translate(c.x, c.y + yOffset);
      scale(currentScale);

      let numLayers = 2;
      fill(red(c.col), green(c.col), blue(c.col), (currentAlpha / 255) * (255 / (2 * numLayers)));
      noStroke();

      let currentShape = c.poly.grow();
      beginShape();
      for (let v of currentShape.vertices) {
        vertex(v.x, v.y);
      }
      endShape(CLOSE);

      pop();

      if (c.life <= 0) {
        activeClouds.splice(i, 1);
      }
    }
    blendMode(BLEND);
  }

  let currentHover = 0;

  if (fadeAlpha > 0) {
    // "Start Journal" text (Fades in + Slides from below)
    if (!isJournalActive) {
      let journalTxt = 'start journal';
      let journalSize = 21;
      textSize(journalSize);
      textFont('DM Sans');
      textAlign(CENTER, CENTER);

      let jx = width / 2;
      let jy = height / 2 + yOffset;

      if (fadeAlpha === 255 && isHoveredCenter(journalTxt, jx, jy, journalSize)) {
        fill(255, fadeAlpha);
        currentHover = 50;
      } else {
        fill(0, fadeAlpha);
      }

      text(journalTxt, jx, jy);
    }

    // Top Right Menu (Fades in + Slides from below)
    let menuItems = ['about', 'instructions', 'new canvas', 'settings'];
    let menuSize = 21;
    let gap = 35;
    let rightMargin = 50;
    let startY = 50 + yOffset;

    textSize(menuSize);
    textAlign(LEFT, BASELINE);
    textFont('DM Sans');

    let totalWidth = 0;
    for (let i = 0; i < menuItems.length; i++) {
      totalWidth += textWidth(menuItems[i]);
      if (i < menuItems.length - 1) totalWidth += gap;
    }

    let currentX = width - rightMargin - totalWidth;

    for (let i = 0; i < menuItems.length; i++) {
      let item = menuItems[i];
      let tw = textWidth(item);

      if (fadeAlpha === 255 && isHovered(item, currentX, startY, menuSize)) {
        fill(255, fadeAlpha);
        currentHover = i + 1;
      } else {
        fill(0, fadeAlpha);
      }

      text(item, currentX, startY);
      currentX += tw + gap;
    }

    if (isSettingsOpen) {
      let settingsX = getSettingsX();
      let panelX = min(settingsX, width - rightMargin - 220);
      let sliderW = 160;

      drawSlider('background music volume', bgMusicVol, 0, 1, panelX, startY + 35, startY + 50, sliderW, fadeAlpha);
      drawSlider('sound effects volume', sfxVol, 0, 1, panelX, startY + 85, startY + 100, sliderW, fadeAlpha);
      drawSlider('microphone threshold', micThreshold, 0.005, 0.2, panelX, startY + 135, startY + 150, sliderW, fadeAlpha);
    }

    // Save text button (Fades in + Slides from below)
    let saveTxt = 'save';
    let saveSize = 21;
    let paperH = 650;
    let saveY = height / 2 + paperH / 2 + 70 + yOffset;

    textSize(saveSize);
    textFont('DM Sans');
    textAlign(LEFT, BASELINE);
    let saveTw = textWidth(saveTxt);
    let saveX = width / 2 - saveTw / 2;

    if (fadeAlpha === 255 && isHovered(saveTxt, saveX, saveY, saveSize)) {
      fill(255, fadeAlpha);
      currentHover = 99;
    } else {
      fill(0, fadeAlpha);
    }

    text(saveTxt, saveX, saveY);

    if (currentHover !== 0 && currentHover !== lastHover) {
      if (hoversound && hoversound.isLoaded()) {
        hoversound.play();
      }
    }
    lastHover = currentHover;
  }

  // Logo Animation (Stays independent and untouched)
  if (echoImg) {
    push();
    imageMode(CENTER);

    let centerW = echoImg.width > 0 ? echoImg.width / 2.2 : 380;
    let centerH = echoImg.height > 0 ? echoImg.height / 2.2 : 140;

    let smallW = centerW * 0.65;
    let smallH = centerH * 0.65;

    let startX = width / 2;
    let startY = height / 2;
    let endX = 25 + smallW / 2;
    let endY = 25 + smallH / 2;

    let posX = lerp(startX, endX, moveProgress);
    let posY = lerp(startY, endY, moveProgress);
    let imgW = lerp(centerW, smallW, moveProgress);
    let imgH = lerp(centerH, smallH, moveProgress);

    image(echoImg, posX, posY, imgW, imgH);
    pop();
  }

  if (isAboutOpen && about) {
    push();
    imageMode(CENTER);

    let targetW = about.width / 3;
    let targetH = about.height / 3;

    let elapsedAbout = millis() - aboutAnimStartTime;
    let t = constrain(elapsedAbout / 500, 0, 1);
    let easeT = 1 - Math.pow(1 - t, 3);
    let scaleFactor = lerp(3.0, 1.0, easeT);

    let drawW = targetW * scaleFactor;
    let drawH = targetH * scaleFactor;

    image(about, width / 2, targetH / 2 + 40, drawW, drawH);
    pop();
  }

  if (isInstructionsOpen && instructionsImg) {
    push();
    imageMode(CENTER);

    let targetW = instructionsImg.width / 3;
    let targetH = instructionsImg.height / 3;

    let elapsedInstr = millis() - instructionsAnimStartTime;
    let t = constrain(elapsedInstr / 500, 0, 1);
    let easeT = 1 - Math.pow(1 - t, 3);
    let scaleFactor = lerp(3.0, 1.0, easeT);

    let drawW = targetW * scaleFactor;
    let drawH = targetH * scaleFactor;

    image(instructionsImg, width / 2, targetH / 2 + 40, drawW, drawH);
    pop();
  }
}

function drawSlider(labelText, val, minVal, maxVal, x, labelY, sliderY, sliderW, alpha) {
  textSize(16);
  textFont('DM Sans');
  textAlign(LEFT, BASELINE);
  fill(0, alpha);
  noStroke();
  text(labelText, x, labelY);

  stroke(0, alpha);
  strokeWeight(6);
  strokeCap(ROUND);
  line(x, sliderY, x + sliderW, sliderY);

  let handleX = map(val, minVal, maxVal, x, x + sliderW);
  noStroke();
  fill(0, alpha);
  circle(handleX, sliderY, 16);
}

function getSettingsX() {
  let menuItems = ['about', 'instructions', 'new canvas', 'settings'];
  let menuSize = 21;
  let gap = 35;
  let rightMargin = 50;
  textSize(menuSize);
  textFont('DM Sans');

  let totalWidth = 0;
  for (let i = 0; i < menuItems.length; i++) {
    totalWidth += textWidth(menuItems[i]);
    if (i < menuItems.length - 1) totalWidth += gap;
  }

  let currentX = width - rightMargin - totalWidth;
  return currentX + textWidth('about') + gap + textWidth('instructions') + gap + textWidth('new canvas') + gap;
}

function generateMicCloud() {
  let paperW = 1000;
  let paperH = 650;

  let cx = random(width / 2 - paperW / 2, width / 2 + paperW / 2);
  let cy = random(height / 2 - paperH / 2, height / 2 + paperH / 2);

  let r = random(20, 90);
  let col = color(random(255), random(255), random(255));

  const v = [];
  const n = 16;
  for (let i = 0; i < n; i++) {
    let a = i * (TAU / n);
    v.push(createVector(cos(a) * r, sin(a) * r));
  }
  let poly = new Poly(v).grow().grow();

  bg.push();
  bg.blendMode(MULTIPLY);
  bg.drawingContext.save();
  bg.drawingContext.beginPath();
  bg.drawingContext.rect(width / 2 - paperW / 2, height / 2 - paperH / 2, paperW, paperH);
  bg.drawingContext.clip();

  bg.translate(cx, cy);
  waterColourBuffer(bg, poly, col);

  bg.drawingContext.restore();
  bg.blendMode(BLEND);
  bg.pop();
}

function mousePressed() {
  userStartAudio();

  if (millis() - introStartTime < holdDuration + animDuration) {
    return;
  }

  if (isAboutOpen || isInstructionsOpen) {
    isAboutOpen = false;
    isInstructionsOpen = false;
    if (click && click.isLoaded()) {
      click.play();
    }
    return;
  }

  if (isSettingsOpen) {
    let settingsX = getSettingsX();
    let panelX = min(settingsX, width - 50 - 220);
    let sliderW = 160;
    let startY = 50;

    if (isOverSlider(mouseX, mouseY, panelX, startY + 50, sliderW)) {
      draggingSlider = 1;
      updateSliderVal(1, mouseX, panelX, sliderW);
      return;
    }
    if (isOverSlider(mouseX, mouseY, panelX, startY + 100, sliderW)) {
      draggingSlider = 2;
      updateSliderVal(2, mouseX, panelX, sliderW);
      return;
    }
    if (isOverSlider(mouseX, mouseY, panelX, startY + 150, sliderW)) {
      draggingSlider = 3;
      updateSliderVal(3, mouseX, panelX, sliderW);
      return;
    }
  }

  if (!isJournalActive) {
    let journalTxt = 'start journal';
    let journalSize = 21;
    let jx = width / 2;
    let jy = height / 2;

    if (isHoveredCenter(journalTxt, jx, jy, journalSize)) {
      isJournalActive = true;
      mic.start();
      if (click && click.isLoaded()) {
        click.play();
      }
      return;
    }
  }

  let menuItems = ['about', 'instructions', 'new canvas', 'settings'];
  let menuSize = 21;
  let gap = 35;
  let rightMargin = 50;
  let startY = 50;

  textSize(menuSize);
  textFont('DM Sans');

  let totalWidth = 0;
  for (let i = 0; i < menuItems.length; i++) {
    totalWidth += textWidth(menuItems[i]);
    if (i < menuItems.length - 1) totalWidth += gap;
  }

  let clickedMenu = false;
  let currentX = width - rightMargin - totalWidth;

  for (let item of menuItems) {
    if (isHovered(item, currentX, startY, menuSize)) {
      clickedMenu = true;

      if (item === 'about') {
        isAboutOpen = true;
        isInstructionsOpen = false;
        aboutAnimStartTime = millis();
      } else if (item === 'instructions') {
        isInstructionsOpen = true;
        isAboutOpen = false;
        instructionsAnimStartTime = millis();
      } else if (item === 'new canvas') {
        resetPaperCanvas();
      } else if (item === 'settings') {
        isSettingsOpen = !isSettingsOpen;
      }

      break;
    }
    currentX += textWidth(item) + gap;
  }

  if (clickedMenu) {
    if (click && click.isLoaded()) {
      click.play();
    }
    return;
  }

  let saveTxt = 'save';
  let saveSize = 21;
  let paperH = 650;
  let saveY = height / 2 + paperH / 2 + 70;
  let saveX = width / 2 - textWidth(saveTxt) / 2;

  if (isHovered(saveTxt, saveX, saveY, saveSize)) {
    if (click && click.isLoaded()) {
      click.play();
    }

    let dateStr = year() + '-' + nf(month(), 2) + '-' + nf(day(), 2);
    let fileName = dateStr + '_journal';
    
    saveCanvas(fileName, 'jpg');
    return;
  }

  let r = random(30, 55);
  const v = [];
  const n = 16;
  
  for (let i = 0; i < n; i++) {
    let a = i * (TAU / n);
    v.push(createVector(cos(a) * r, sin(a) * r));
  }
  
  let newPoly = new Poly(v).grow().grow();

  let rCol = random(100, 255);
  let gCol = random(100, 240);
  let bCol = random(180, 255);

  activeClouds.push({
    x: mouseX,
    y: mouseY,
    poly: newPoly,
    col: color(rCol, gCol, bCol),
    life: 30,
    maxLife: 30
  });
}

function mouseDragged() {
  if (draggingSlider) {
    let settingsX = getSettingsX();
    let panelX = min(settingsX, width - 50 - 220);
    let sliderW = 160;
    updateSliderVal(draggingSlider, mouseX, panelX, sliderW);
  }
}

function mouseReleased() {
  draggingSlider = null;
}

function isOverSlider(mx, my, x, y, w) {
  return mx >= x - 10 && mx <= x + w + 10 && my >= y - 12 && my <= y + 12;
}

function updateSliderVal(num, mx, x, w) {
  let norm = constrain(map(mx, x, x + w, 0, 1), 0, 1);
  if (num === 1) {
    bgMusicVol = norm;
  } else if (num === 2) {
    sfxVol = norm;
  } else if (num === 3) {
    micThreshold = map(norm, 0, 1, 0.005, 0.2);
  }
}

function isHovered(txt, x, y, size) {
  textSize(size);
  textFont('DM Sans');
  let tw = textWidth(txt);
  return mouseX >= x && mouseX <= x + tw && mouseY >= y - size && mouseY <= y;
}

function isHoveredCenter(txt, cx, cy, size) {
  textSize(size);
  textFont('DM Sans');
  let tw = textWidth(txt);
  return mouseX >= cx - tw / 2 && mouseX <= cx + tw / 2 && mouseY >= cy - size / 2 && mouseY <= cy + size / 2;
}

function waterColourBuffer(pg, poly, colour) {
  const numLayers = 2;
  pg.fill(red(colour), green(colour), blue(colour), 255 / (2 * numLayers));
  pg.noStroke();
  
  poly = poly.grow().grow();
  
  for (let i = 0; i < numLayers; i++) {
    if (i == int(numLayers / 3) || i == int(2 * numLayers / 3)) {
      poly = poly.grow().grow();
    }
    
    let currentShape = poly.grow();
    pg.beginShape();
    for (let v of currentShape.vertices) {
      pg.vertex(v.x, v.y);
    }
    pg.endShape(CLOSE);
  }   
}

class Poly {
  constructor(vertices, modifiers) {
    this.vertices = vertices;
    if(!modifiers) {
      modifiers = [];
      for(let i = 0; i < vertices.length; i ++) {
        modifiers.push(random(0.1, 0.8));
      }
    }
    this.modifiers = modifiers;
  }
  
  grow() {
    const grownVerts = [];
    const grownMods = [];
    for(let i = 0; i < this.vertices.length; i ++) {
      const j = (i + 1) % this.vertices.length;
      const v1 = this.vertices[i];
      const v2 = this.vertices[j];
      
      const mod = this.modifiers[i];
      
      const chmod = m => {
        return m + (rand() - 0.5) * 0.1;
      }
      
      grownVerts.push(v1);
      grownMods.push(chmod(mod));
      
      const segment = p5.Vector.sub(v2, v1);
      const len = segment.mag();
      segment.mult(rand());
      
      const v = p5.Vector.add(segment, v1);
      
      segment.rotate(-PI/2 + (rand()-0.5) * PI/4);
      segment.setMag(rand() * len/2 * mod);
      v.add(segment);
      
      grownVerts.push(v);
      grownMods.push(chmod(mod));
    }
    return new Poly(grownVerts, grownMods);
  }
  
  dup() {
    return new Poly(Array.from(this.vertices), Array.from(this.modifiers));
  }
}

function rand() {
  return distribute(random(1));
}

function distribute(x) {
  return pow((x - 0.5) * 1.58740105, 3) + 0.5;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetPaperCanvas();
}