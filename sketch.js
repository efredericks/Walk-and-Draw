// font: https://fonts.google.com/specimen/Nerko+One
// https://support.google.com/chrome/thread/20108907/how-to-stop-desktop-browser-chrome-from-interpreting-my-wacom-tablet-as-a-touchscreen?hl=en

// font: https://fonts.google.com/specimen/Nerko+One
// https://support.google.com/chrome/thread/20108907/how-to-stop-desktop-browser-chrome-from-interpreting-my-wacom-tablet-as-a-touchscreen?hl=en

let history = [];
let gfx;
let debounceDelay = 5; //15;
let debounce = 0;
let font, fontsize;
let windowScale;
let dirty = true;
let colorPicker, sizeSlider;
let btnSave, btnClear;
let btnUndo, btnRedo;

const DIM = 1000;

let bgImage;
let savedHistory = [];

function preload() {
  // font = loadFont("NerkoOne-Regular.ttf");
  bgImage = loadImage("thumbnail_east_core_1916-1925.jpg");
}

function setup() {
  windowScale = DIM / 1000;
  fontsize = 24 * windowScale;

  createCanvas(DIM, DIM + fontsize);
  gfx = createGraphics(DIM, DIM);
  gfx.background(255);

  bgImage.resize(0, DIM);

  history = [];

  // font things
  textFont("Arial");
  gfx.textFont("Arial");
  textSize(fontsize);
  gfx.textSize(fontsize);
  gfx.textAlign(LEFT, CENTER);
  textAlign(LEFT, CENTER);

  frameRate(60);

  // elements
  colorPicker = createColorPicker(color(20));
  colorPicker.mouseClicked(changeStroke);
  colorPicker.position(width - fontsize, 0).size(fontsize, fontsize);
  gfx.fill(colorPicker.color());

  // size of point
  sizeSlider = createSlider(1, 20 * windowScale, 1, 1);
  sizeSlider.position(width - fontsize - 90, 0);
  sizeSlider.style("width", "80px");

  // UI
  let titleWidth = drawHeader();
  btnSave = createButton("Save");
  btnSave.mousePressed(saveImg);
  // btnSave.style('font-size', fontsize/1.6+'px');
  btnSave.position(titleWidth + 10, 1);

  btnClear = createButton("Clear");
  btnClear.mousePressed(clearImg);
  // btnSave.style('font-size', fontsize/1.6+'px');
  btnClear.position(
    btnSave.size().width + btnSave.size().width + titleWidth - 25,
    1
  );

  btnUndo = createButton("Undo");
  btnUndo.mousePressed(undo);
  btnUndo.position(btnClear.position().x + btnClear.size().width + 10, 1);

  btnRedo = createButton("Redo");
  btnRedo.mousePressed(redo);
  btnRedo.position(btnUndo.position().x + btnUndo.size().width + 10, 1);

  gfx.noStroke();
  gfx.image(bgImage, 0, 0);
}

function draw() {
  if (dirty) {
    background(255);
    image(gfx, 0, 24);
    drawHeader();
    dirty = false;
  }

  // ctrl+z
  if (keyIsDown(CONTROL) && keyIsDown(90) && debounce == 0) {
    undo();
    debounce = debounceDelay;
    dirty = true;
  }
  if (debounce > 0) debounce--;
}

function saveImg() {
  gfx.save("image.png");
}

function clearImg() {
  dirty = true;
  gfx.clear();
  gfx.background(255);
  gfx.image(bgImage, 0, 0);
  history = [];
  savedHistory = [];
}

function changeStroke() {
  dirty = true;
}

function drawHeader() {
  let hdr = "GVSU Walk-and-Draw";
  text(hdr, 3, fontsize / 2);
  line(0, fontsize, width, fontsize);

  return textWidth(hdr) + 3;
}

function mouseDragged() {
  let x = mouseX;
  let y = mouseY - fontsize;

  if (y > fontsize) {
    gfx.strokeWeight(sizeSlider.value());
    gfx.stroke(colorPicker.color());
    let colorString = colorPicker.color().toString();
    history.push({ x: x, y: y, size: sizeSlider.value(), color: colorString });
    drawPoint(x, y);
  }
}

function drawPoint(x, y) {
  gfx.point(x, y);
  dirty = true;
}

function undo() {
  if (history.length > 0) {
    savedHistory.push(history.pop());
    redrawCanvas();
  }
}

function redo() {
  if (savedHistory.length > 0) {
    history.push(savedHistory.pop());
    redrawCanvas();
  }
}

function redrawCanvas() {
  gfx.clear();
  gfx.background(255);
  gfx.image(bgImage, 0, 0);
  for (let point of history) {
    gfx.strokeWeight(point.size);
    gfx.stroke(point.color);
    gfx.point(point.x, point.y);
  }
  dirty = true;
}
