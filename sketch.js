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
let colorPicker, sizeSlider, backgroundColorPicker;
let btnSave, btnClear, btnUndo, btnRedo;
let backgroundColor = "#FFFFFF"; // Initial background color (white)
let penTip;
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
  penTip = 'circle';
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

  colorPicker.addEventListener('input', changeStroke);
  sizeSlider.addEventListener('input', changeStroke);
  btnUndo.addEventListener('click', undo);
  btnRedo.addEventListener('click', redo);

  gfx.noStroke();
  setUpMap();
  trackCurrentLocation();
}

function changePenTip() {
  penTip = document.getElementById('penTipSelect').value;
}

function draw() {
  if (dirty) {
    image(gfx, 0, 24);
    drawHeader();
    dirty = false;
  }

  if (keyIsDown(CONTROL) && keyIsDown(90) && debounce === 0) {
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
        shape: penTip, // Store the shape of the brush
        points: [],
      };
      strokes.push(currentStroke);
    }

    currentStroke.points.push({ x: x, y: y });
    drawLine(currentStroke.points[currentStroke.points.length - 2], currentStroke.points[currentStroke.points.length - 1]);
  }
}

function drawLine(startIndex, endIndex) {
  let stroke = currentStroke;
  strokeWeight(stroke.size);
  stroke(stroke.color);

  if (
    startIndex >= 0 &&
    startIndex < stroke.points.length &&
    endIndex >= 0 &&
    endIndex < stroke.points.length
  ) {
    let startPoint = stroke.points[startIndex];
    let endPoint = stroke.points[endIndex];

    if (penTip === 'circle') {
      circle(endPoint.x, endPoint.y, stroke.size);
    } else if (penTip === 'square') {
      square(endPoint.x, endPoint.y, stroke.size);
    } else if (penTip === 'triangle') {
      let halfSize = stroke.size / 2;
      let angle = atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

      let x1 = endPoint.x + cos(angle) * halfSize;
      let y1 = endPoint.y + sin(angle) * halfSize;
      let x2 = endPoint.x + cos(angle + (2 * PI / 3)) * halfSize;
      let y2 = endPoint.y + sin(angle + (2 * PI / 3)) * halfSize;
      let x3 = endPoint.x + cos(angle + (4 * PI / 3)) * halfSize;
      let y3 = endPoint.y + sin(angle + (4 * PI / 3)) * halfSize;

      triangle(x1, y1, x2, y2, x3, y3);
    } else if (penTip === 'water-color') {
      //TODO CHECK HERE!
      blob(50, endPoint.x, endPoint.y);
    }

    // Set the shape property of the current stroke
    stroke.shape = penTip;

    dirty = true;
  }
}

function blob(h, x1, y1) {
  noStroke();
  fill(h, 80, 80, 0.02);

  for (let i = 0; i <= 4; i++) {
    let rs = random(2.0) - 1.0;

    beginShape();
    for (let a = 0; a <= 360; a += 10) {
      let r = 150 + 25 * noise(a + 4 * rs) * 2 - 1;
      let x = r * cos(a);
      let y = r * sin(a);

      curveVertex(x1 + x, y1 - y);
      filter(BLUR, 10);
    }
    endShape();
  }
}




function mouseReleased() {
  if (currentStroke !== null) {
    strokes.push(currentStroke);
    currentStroke = null;
    savedStrokes = []; // Clear the savedStrokes array
  }
}

function undo() {
  if (strokes.length > 0) {
    let lastStroke = strokes.pop();
    savedStrokes.push(lastStroke); // Move the stroke to savedStrokes array
    redrawCanvas();
  }
}

function redo() {
  if (savedStrokes.length > 0) {
    let lastSavedStroke = savedStrokes.pop();
    strokes.push(lastSavedStroke); // Move the stroke back to strokes array
    redrawCanvas();
  }
}

function redrawCanvas() {
  gfx.clear();
  gfx.background(255);

  // Draw strokes from strokes array
  for (let stroke of strokes) {
    gfx.strokeWeight(stroke.size);
    gfx.stroke(stroke.color);
    for (let i = 0; i < stroke.points.length - 1; i++) {
      let startPoint = stroke.points[i];
      let endPoint = stroke.points[i + 1];
      drawLine(startPoint, endPoint);
    }
  }

  // Draw saved strokes from savedStrokes array
  for (let stroke of savedStrokes) {
    gfx.strokeWeight(stroke.size);
    gfx.stroke(stroke.color);
    for (let i = 0; i < stroke.points.length - 1; i++) {
      let startPoint = stroke.points[i];
      let endPoint = stroke.points[i + 1];
      drawLine(startPoint, endPoint);
    }
  }

  dirty = true;
}
