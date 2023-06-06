// font: https://fonts.google.com/specimen/Nerko+One
// https://support.google.com/chrome/thread/20108907/how-to-stop-desktop-browser-chrome-from-interpreting-my-wacom-tablet-as-a-touchscreen?hl=en

let strokes = [];
let savedStrokes = [];
let currentStroke = null;
let gfx;
let debounceDelay = 5; //15;
let debounce = 0;
let font, fontsize;
let windowScale;
let dirty = true;
let colorPicker, sizeSlider;
let btnSave, btnClear, btnUndo, btnRedo;

const DIM = 1000;
//map things
let map;
const mapboxAccessToken = 'pk.eyJ1IjoiZ29vZGxpbmEiLCJhIjoiY2xpM2F2ZGlpMGxseDNnbnRqMWl1c3A3bCJ9.WMJlwaLWmoNc-YuSv-92Ow';
let hollandLatitude = 42.78;
let hollandLongitude = -86.1089;
const zoomLevel = 12;

let marker;
let currentPosition;

function setUpMap() {
  mapboxgl.accessToken = mapboxAccessToken;
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [hollandLongitude, hollandLatitude],
    zoom: zoomLevel
  });

  map.on('load', () => {
    map.addSource('current-location', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [hollandLongitude, hollandLatitude]
        }
      }
    });

    map.addLayer({
      id: 'current-location',
      type: 'circle',
      source: 'current-location',
      paint: {
        'circle-radius': 5,
        'circle-color': 'blue',
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white'
      }
    });
  });

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position => {
      hollandLatitude = position.coords.latitude;
      hollandLongitude = position.coords.longitude;
      updateDotPosition();
    });
  }
}

function updateDotPosition() {
  map.getSource('current-location').setData({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [hollandLongitude, hollandLatitude]
    }
  });
}

function trackCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position => {
      currentPosition = position;
    });
  }
}

function setup() {
  windowScale = DIM / 1000;
  fontsize = 24 * windowScale;

  createCanvas(windowWidth, windowHeight);
  gfx = createGraphics(DIM, DIM);
  gfx.background(255);

  textFont('Arial');
  gfx.textFont('Arial');
  textSize(fontsize);
  gfx.textSize(fontsize);
  gfx.textAlign(LEFT, CENTER);
  textAlign(LEFT, CENTER);

  frameRate(60);

  let titleWidth = drawHeader();

  btnSave = document.getElementById('btnSave');
  btnClear = document.getElementById('btnClear');
  btnUndo = document.getElementById('btnUndo');
  btnRedo = document.getElementById('btnRedo');
  colorPicker = document.getElementById('colorPicker');
  sizeSlider = document.getElementById('sizeSlider');

 // btnSave.addEventListener('click', saveImg);
 // btnClear.addEventListener('click', clearImg);
  //btnUndo.addEventListener('click', undo);
 // btnRedo.addEventListener('click', redo);

    

  gfx.noStroke();
  setUpMap();
  trackCurrentLocation();
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
  gfx.save('image.png');
}

function clearImg() {
  dirty = true;
  gfx.clear();
  gfx.background(255);
  strokes = [];
}

function changeStroke() {
  if (currentStroke !== null) {
    currentStroke.size = sizeSlider.value;
    currentStroke.color = colorPicker.value;
    dirty = true;
  }
}


function drawHeader() {
  let hdr = 'GVSU Walk-and-Draw';
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
        size: sizeSlider.value,
        color: colorPicker.value,
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

  if (
    startIndex >= 0 &&
    startIndex < stroke.points.length &&
    endIndex >= 0 &&
    endIndex < stroke.points.length
  ) {
    let startPoint = stroke.points[startIndex];
    let endPoint = stroke.points[endIndex];
    gfx.line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
    dirty = true;
  }
}

function mouseReleased() {
  currentStroke = null;
}

function undo() {
  if (strokes.length > 0) {
    let lastStroke = strokes.pop();
    savedStrokes.push(lastStroke);
    redrawCanvas();
  }
}

function redo() {
  if (savedStrokes.length > 0) {
    let lastSavedStroke = savedStrokes.pop();
    strokes.push(lastSavedStroke);
    redrawCanvas();
  }
}

function redrawCanvas() {
  gfx.clear();
  gfx.background(255);
  //gfx.image(bgImage, 0, 0);
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
