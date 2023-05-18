// font: https://fonts.google.com/specimen/Nerko+One
// https://support.google.com/chrome/thread/20108907/how-to-stop-desktop-browser-chrome-from-interpreting-my-wacom-tablet-as-a-touchscreen?hl=en

let strokes = [];
let currentStroke = null;
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
let savedStrokes = [];

function preload() {
  bgImage = loadImage("thumbnail_east_core_1916-1925.jpg");
}

function setup() {
  windowScale = DIM / 1000;
  fontsize = 24 * windowScale;

  createCanvas(DIM, DIM + fontsize);
  gfx = createGraphics(DIM, DIM);
  gfx.background(255);

  bgImage.resize(0, DIM);

  strokes = [];

  textFont("Arial");
  gfx.textFont("Arial");
  textSize(fontsize);
  gfx.textSize(fontsize);
  gfx.textAlign(LEFT, CENTER);
  textAlign(LEFT, CENTER);

  frameRate(60);

  colorPicker = createColorPicker(color(20));
  colorPicker.mouseClicked(changeStroke);
  colorPicker.position(width - fontsize, 0).size(fontsize, fontsize);
  gfx.fill(colorPicker.color());

  sizeSlider = createSlider(1, 20 * windowScale, 1, 1);
  sizeSlider.position(width - fontsize - 90, 0);
  sizeSlider.style("width", "80px");

  let titleWidth = drawHeader();
  btnSave = createButton("Save");
  btnSave.mousePressed(saveImg);
  btnSave.position(titleWidth + 10, 1);

  btnClear = createButton("Clear");
  btnClear.mousePressed(clearImg);
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
  strokes = [];
  savedStrokes = [];
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
    if (currentStroke === null) {
      currentStroke = {
        size: sizeSlider.value(),
        color: colorPicker.color().toString(),
        points: [],
      };
      strokes.push(currentStroke);
    }

    currentStroke.points.push({ x: x, y: y });
    drawLine(currentStroke.points.length - 2, currentStroke.points.length - 1);
  }
}

function drawLine(startIndex, endIndex) {
  let stroke = currentStroke;
  gfx.strokeWeight(stroke.size);
  gfx.stroke(stroke.color);
  let startPoint = stroke.points[startIndex];
  let endPoint = stroke.points[endIndex];
  gfx.line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
  dirty = true;
}

function mouseReleased() {
  currentStroke = null;
}

function undo() {
  if (strokes.length > 0) {
    savedStrokes.push(strokes.pop());
    redrawCanvas();
  }
}

function redo() {
  if (savedStrokes.length > 0) {
    strokes.push(savedStrokes.pop());
    redrawCanvas();
  }
}

function redrawCanvas() {
  gfx.clear();
  gfx.background(255);
  gfx.image(bgImage, 0, 0);
  for (let stroke of strokes) {
    gfx.strokeWeight(stroke.size);
    gfx.stroke(stroke.color);
    for (let i = 0; i < stroke.points.length - 1; i++) {
      let startPoint = stroke.points[i];
      let endPoint = stroke.points[i + 1];
      gfx.line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
    }
  }
  dirty = true;
}
