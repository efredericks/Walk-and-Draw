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
let mapContainer;

const mapboxAccessToken = 'pk.eyJ1IjoiZ29vZGxpbmEiLCJhIjoiY2xpM2F2ZGlpMGxseDNnbnRqMWl1c3A3bCJ9.WMJlwaLWmoNc-YuSv-92Ow';
const DIM = 1000;
const CANVAS_WIDTH = 200;
const CANVAS_HEIGHT = 200;
const NUM_CANVASES = 5;

let bgImage;
let savedStrokes = [];
let canvasList = [];
let expandedIndex = -1;

function preload() {
  bgImage = loadImage("thumbnail_east_core_1916-1925.jpg");
}

function setup() {
  windowScale = DIM / 1000;
  fontsize = 24 * windowScale;

  createCanvas(windowWidth, windowHeight);
  gfx = createGraphics(DIM, DIM);
  gfx.background(255);

  bgImage.resize(0, DIM);

  let hollandLatitude = 42.78;
  let hollandLongitude = -86.1089;
  const zoomLevel = 12; // Replace with your desired zoom level

  // Create a container div for the map
  mapContainer = createDiv();
  mapContainer.style('position', 'absolute');
  mapContainer.style('top', '0');
  mapContainer.style('right', '0');
  mapContainer.style('bottom', '0');
  mapContainer.style('left', '50%');

  // Add the map
  const map = new mapboxgl.Map({
    container: mapContainer.elt,
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [hollandLongitude, hollandLatitude],
    zoom: zoomLevel,
    accessToken: mapboxAccessToken
  });

  // Set up event listeners for map interactions
  map.on('load', () => {
    // Map is ready
    console.log('Map loaded!');
  });

  // Resize the map when the window size changes
  window.addEventListener('resize', () => {
    map.resize();
  });

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
  colorPicker.position(CANVAS_WIDTH*2, 40).size(fontsize, fontsize);
  gfx.fill(colorPicker.color());

  sizeSlider = createSlider(1, 20 * windowScale, 1, 1);
  sizeSlider.position(CANVAS_WIDTH*2 + fontsize + 10, 40);
  sizeSlider.style("width", "80px");

  let buttonsContainer = createDiv();
  buttonsContainer.id('buttons');
  buttonsContainer.child(colorPicker);
  buttonsContainer.child(sizeSlider);
  buttonsContainer.position(0, 0);

  let titleWidth = drawHeader();
    
  btnSave = createButton("Save");
  btnSave.mousePressed(saveImg);
  btnSave.parent(buttonsContainer);
  btnSave.position(10, fontsize + 40);

  btnClear = createButton("Clear");
  btnClear.mousePressed(clearImg);
  btnClear.parent(buttonsContainer);
  btnClear.position(10, btnSave.position().y + btnSave.size().height + 10);

  btnUndo = createButton("Undo");
  btnUndo.mousePressed(undo);
  btnUndo.parent(buttonsContainer);
  btnUndo.position(10, btnClear.position().y + btnClear.size().height + 10);

  btnRedo = createButton("Redo");
  btnRedo.mousePressed(redo);
  btnRedo.parent(buttonsContainer);
  btnRedo.position(10, btnUndo.position().y + btnUndo.size().height + 10);

  canvasList.push(gfx.get());

  gfx.background(255);
}

function draw() {
  let saveFlag = false;
  if (mouseIsPressed && expandedIndex === -1) {
    let x = mouseX;
    let y = mouseY;

    if (x < CANVAS_WIDTH && y < CANVAS_HEIGHT) {
      let c = gfx.get(x, y);
      let alphaValue = (c[0] + c[1] + c[2]) / 3;

      if (alphaValue > 0) {
        saveFlag = true;
        dirty = true;
        if (currentStroke == null) {
          currentStroke = new Stroke(
            colorPicker.color(),
            sizeSlider.value(),
            x,
            y
          );
        } else {
          currentStroke.addPoint(x, y);
        }
        gfx.stroke(currentStroke.color);
        gfx.strokeWeight(currentStroke.size);
        gfx.line(
          currentStroke.x[currentStroke.x.length - 1],
          currentStroke.y[currentStroke.y.length - 1],
          x,
          y
        );
        image(gfx, 0, 0);
        if (debounce === 0) {
          debounce = debounceDelay;
          savedStrokes = [];
          for (let i = 0; i < strokes.length; i++) {
            savedStrokes.push(strokes[i].clone());
          }
        }
      }
    }
  }

  debounce--;

  if (debounce === 0 && saveFlag) {
    saveFlag = false;
    strokes.push(currentStroke);
    currentStroke = null;
  }

  if (dirty) {
    dirty = false;
    redrawThumbnails();
  }

  if (expandedIndex !== -1) {
    background(255);
    image(canvasList[expandedIndex], 0, 0);
  }
}

function changeStroke() {
  gfx.fill(this.color());
}

function undo() {
  if (expandedIndex === -1) {
    if (strokes.length > 0) {
      savedStrokes.push(strokes.pop());
      redrawThumbnails();
    }
  }
}

function redo() {
  if (expandedIndex === -1) {
    if (savedStrokes.length > 0) {
      strokes.push(savedStrokes.pop());
      redrawThumbnails();
    }
  }
}

function saveImg() {
  if (expandedIndex !== -1) {
    save(gfx, "map_drawing.png");
  }
}

function clearImg() {
  if (expandedIndex === -1) {
    gfx.background(255);
    strokes = [];
    savedStrokes = [];
    redrawThumbnails();
  }
}

function redrawThumbnails() {
  let tileWidth = (width - CANVAS_WIDTH) / NUM_CANVASES;
  let tileHeight = CANVAS_HEIGHT / NUM_CANVASES;

  for (let i = 0; i < strokes.length; i++) {
    canvasList[i] = createGraphics(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvasList[i].background(255);
    let s = strokes[i];
    canvasList[i].stroke(s.color);
    canvasList[i].strokeWeight(s.size);
    for (let j = 1; j < s.x.length; j++) {
      canvasList[i].line(s.x[j - 1], s.y[j - 1], s.x[j], s.y[j]);
    }
  }

  background(255);
  image(gfx, 0, 0);

  for (let i = 0; i < canvasList.length; i++) {
    let x = CANVAS_WIDTH + (i % NUM_CANVASES) * tileWidth;
    let y = (i % NUM_CANVASES) * tileHeight;
    let w = tileWidth;
    let h = tileHeight;

    if (i === expandedIndex) {
      w = CANVAS_WIDTH;
      h = CANVAS_HEIGHT;
    }

    image(canvasList[i], x, y, w, h);
  }
}

function drawHeader() {
  let headerHeight = fontsize + 10;
  fill(220);
  rect(0, 0, CANVAS_WIDTH, headerHeight);

  let title = "Map Drawing App";
  let titleWidth = textWidth(title);

  fill(0);
  text(title, CANVAS_WIDTH / 2 - titleWidth / 2, headerHeight / 2);

  return titleWidth;
}
