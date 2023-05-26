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

let bgImage;
let gfx;
let map;
let mapMarker;
let markerInterval;

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
  map = new mapboxgl.Map({
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
    startLocationTracking();
  });

  // Resize the map when the window size changes
  window.addEventListener('resize', () => {
    map.resize();
  });

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

  let buttonsContainer = createDiv();
  buttonsContainer.id('buttons');
  buttonsContainer.child(colorPicker);
  buttonsContainer.child(sizeSlider);
  buttonsContainer.position(0, 0);

  let titleWidth = drawHeader();
  btnSave = createButton("Save");
  btnSave.mousePressed(saveImg);
  btnSave.parent(buttonsContainer);
  btnSave.position(10, fontsize + 30);

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

  gfx.background(255);
}

function draw() {
  if (dirty) {
    clear();
    let headerWidth = drawHeader();
    image(gfx, 0, 0, headerWidth, CANVAS_HEIGHT);
    dirty = false;
  }
}

function changeStroke() {
  gfx.fill(this.color());
}

function undo() {
  gfx.background(255);
  redraw();
}

function redo() {
  // Not implemented
}

function saveImg() {
  save(gfx, "map_drawing.png");
}

function clearImg() {
  gfx.background(255);
  redraw();
}

function drawHeader() {
  let title = "GVSU Walk and Draw";

  let titleWidth = textWidth(title);

  fill(255);
  rect(0, 0, CANVAS_WIDTH, fontsize + 10);

  fill(0);
  text(title, (titleWidth), fontsize);

  return titleWidth;
}

function mousePressed() {
  let x = mouseX;
  let y = mouseY;

  if (x < CANVAS_WIDTH && y < CANVAS_HEIGHT) {
    gfx.fill(colorPicker.color());
    gfx.noStroke();
    gfx.ellipse(x, y, sizeSlider.value(), sizeSlider.value());
    dirty = true;
  }
}

function startLocationTracking() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        updateMarkerPosition(longitude, latitude);
        markerInterval = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { longitude, latitude } = position.coords;
              updateMarkerPosition(longitude, latitude);
            },
            (error) => {
              console.error('Error retrieving current location:', error);
            }
          );
        }, 5000);
      },
      (error) => {
        console.error('Error retrieving current location:', error);
      }
    );
  } else {
    console.error('Geolocation is not supported by this browser.');
  }
}

function updateMarkerPosition(longitude, latitude) {
  if (mapMarker) {
    mapMarker.setLngLat([longitude, latitude]);
  } else {
    const markerElement = document.createElement('div');
    markerElement.style.width = '12px';
    markerElement.style.height = '12px';
    markerElement.style.borderRadius = '50%';
    markerElement.style.backgroundColor = 'blue';

    mapMarker = new mapboxgl.Marker(markerElement)
      .setLngLat([longitude, latitude])
      .addTo(map);
  }
}

function stopLocationTracking() {
  clearInterval(markerInterval);
}
