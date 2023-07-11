// font: https://fonts.google.com/specimen/Nerko+One
// https://support.google.com/chrome/thread/20108907/how-to-stop-desktop-browser-chrome-from-interpreting-my-wacom-tablet-as-a-touchscreen?hl=en

let strokes = [];
let savedStrokes = [];
let currentStroke = null;
let gfx, stampGFX;
let debounceDelay = 5; //15;
let debounce = 0;
let font, fontsize;
let windowScale;
let dirty = true;
let colorPicker, sizeSlider;
let btnSave, btnClear, btnUndo, btnRedo;
let eraseEnable = false;
//stamp canvas things
let popUpCanvas1, popUpCanvasElement1, computedStyle1, stampCanvasWidth1, stampCanvasHeight1;
let popUpCanvas2, popUpCanvasElement2, computedStyle2, stampCanvasWidth2, stampCanvasHeight2;
let popUpCanvas3, popUpCanvasElement3, computedStyle3, stampCanvasWidth3, stampCanvasHeight3;
let canvasRect1, canvasLeft1, canvasTop1;
let canvasRect2, canvasLeft2, canvasTop2;
let canvasRect3, canvasLeft3, canvasTop3;
let selectedStamp;
let stamp = 'stamp1';
let backgroundColor = "#FFFFFF"; // Initial background color (white)
const DIM = 1000;
//map things
let penTip;
let map;
const mapboxAccessToken = 'pk.eyJ1IjoiZ29vZGxpbmEiLCJhIjoiY2xpM2F2ZGlpMGxseDNnbnRqMWl1c3A3bCJ9.WMJlwaLWmoNc-YuSv-92Ow';
let hollandLatitude = 42.78;
let hollandLongitude = -86.1089;
const zoomLevel = 5;

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
  penTip = 'Circle';

  var canvas = createCanvas(windowWidth, windowHeight);
  canvas.id('canvas');
  canvas.style('z-index', '1');
  gfx = createGraphics(width, height);
  gfx.background(255, 255, 255, 0);

  textFont('Arial');
  gfx.textFont('Arial');
  textSize(fontsize);
  gfx.textSize(fontsize);
  gfx.textAlign(LEFT, CENTER);
  textAlign(LEFT, CENTER);

  //creation of the stampping canvas
  let CreateCanvases = createStampCanvases();
  frameRate(120);

  let titleWidth = drawHeader();

  //buttons for all \/\/
  btnSave = document.getElementById('btnSave');
  btnClear = document.getElementById('btnClear');
  // btnUndo = document.getElementById('btnUndo');
  // btnRedo = document.getElementById('btnRedo');
  colorPicker = document.getElementById('colorPicker');
  sizeSlider = document.getElementById('sizeSlider');
  colorPicker.addEventListener('input', changeStroke);
  sizeSlider.addEventListener('input', changeStroke);
  // btnUndo.addEventListener('click', undo);
  //btnRedo.addEventListener('click', redo);
  let stampDropDown = document.getElementById('stamp-dropdown');


  gfx.noStroke();
  setUpMap();
  trackCurrentLocation();
}
function createStampCanvases() {
  //stampcanvas top
  popUpCanvasElement1 = document.getElementById("stampcanvas1");

  computedStyle1 = window.getComputedStyle(popUpCanvasElement1);

  // Get the width and height values from the computed style
  stampCanvasWidth1 = parseInt(computedStyle1.getPropertyValue("width"), 10);
  stampCanvasHeight1 = parseInt(computedStyle1.getPropertyValue("height"), 10);
  canvasRect1 = popUpCanvasElement1.getBoundingClientRect();

  // Get the canvas position relative to the document
  canvasLeft1 = canvasRect1.left + window.scrollX;
  canvasTop1 = canvasRect1.top + window.scrollY;

  console.log(canvasLeft1); // Output: X-coordinate position
  console.log(canvasTop1); // Output: Y-coordinate position

  console.log(stampCanvasWidth1);
  console.log(stampCanvasHeight1);
  popUpCanvas1 = createGraphics(stampCanvasWidth1, stampCanvasHeight1);
  popUpCanvas1.position(canvasLeft1, canvasTop1);
  popUpCanvas1.style("z-index", "2");

  // stampCanvas middle
  popUpCanvasElement2 = document.getElementById("stampcanvas2");

  computedStyle2 = window.getComputedStyle(popUpCanvasElement2);

  // Get the width and height values from the computed style
  stampCanvasWidth2 = parseInt(computedStyle2.getPropertyValue("width"), 10);
  stampCanvasHeight2 = parseInt(computedStyle2.getPropertyValue("height"), 10);
  canvasRect2 = popUpCanvasElement2.getBoundingClientRect();

  // Get the canvas position relative to the document
  canvasLeft2 = canvasRect2.left + window.scrollX;
  canvasTop2 = canvasRect2.top + window.scrollY;

  console.log(canvasLeft2); // Output: X-coordinate position
  console.log(canvasTop2); // Output: Y-coordinate position

  console.log(stampCanvasWidth2);
  console.log(stampCanvasHeight2);
  popUpCanvas2 = createGraphics(stampCanvasWidth2, stampCanvasHeight2);
  popUpCanvas2.position(canvasLeft2, canvasTop2);
  popUpCanvas2.style("z-index", "2");

  // stampCanvas Bottom
  popUpCanvasElement3 = document.getElementById("stampcanvas3");

  computedStyle3 = window.getComputedStyle(popUpCanvasElement3);

  // Get the width and height values from the computed style
  stampCanvasWidth3 = parseInt(computedStyle3.getPropertyValue("width"), 10);
  stampCanvasHeight3 = parseInt(computedStyle3.getPropertyValue("height"), 10);
  canvasRect3 = popUpCanvasElement3.getBoundingClientRect();

  // Get the canvas position relative to the document
  canvasLeft3 = canvasRect3.left + window.scrollX;
  canvasTop3 = canvasRect3.top + window.scrollY;

  console.log(canvasLeft3); // Output: X-coordinate position
  console.log(canvasTop3); // Output: Y-coordinate position

  console.log(stampCanvasWidth3);
  console.log(stampCanvasHeight3);
  popUpCanvas3 = createGraphics(stampCanvasWidth3, stampCanvasHeight3);
  popUpCanvas3.position(canvasLeft3, canvasTop3);
  popUpCanvas3.style("z-index", "2");

}
function saveStamp1() {
  // POTENTIALLY SKIP THIS STEP
  // Save the drawing from the pop-up canvas as a stamp
  stamp1 = popUpCanvas.get();

  // Clear the pop-up canvas
  popUpCanvas.clear();
  clear();
}

function draw() {
  if (dirty) {
    //background();
    image(gfx, 0, 24);
    drawHeader();
    dirty = false;
  }
  image(popUpCanvas1, canvasLeft1, canvasTop1);
  image(popUpCanvas2, canvasLeft2, canvasTop2);
  image(popUpCanvas3, canvasLeft3, canvasTop3);

  if (keyIsDown(CONTROL) && keyIsDown(90) && debounce === 0) {
    undo();
    debounce = debounceDelay;
    dirty = true;
  }//delay in between drawing shapes
  if (debounce > 0) debounce--;
}

function saveImg() {
  gfx.save('image.png');
  popUpCanvas1.save('canvas1image')
}

function clearImg() {
  dirty = true;
  console.log("Clear");
  gfx.clear();
  strokes = [];
  savedStrokes = [];
  clear();
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
  // Draw on the pop-up canvas while dragging the mouse
  if (
    mouseX >= canvasLeft1 &&
    mouseX <= canvasLeft1 + stampCanvasWidth1 &&
    mouseY >= canvasTop1 &&
    mouseY <= canvasTop1 + stampCanvasHeight1
  ) {
    console.log("we made it into canvas 1");
    if (currentStroke === null) {
      currentStroke = {
        size: sizeSlider.value,
        color: colorPicker.value,
        shape: penTip, // Store the shape of the brush
        points: [],
      };
      strokes.push(currentStroke);
    }
    let stroke = currentStroke;
    popUpCanvas1.noStroke();
    popUpCanvas1.fill(stroke.color);
    popUpCanvas1.circle(mouseX - canvasLeft1, mouseY - canvasTop1, stroke.size);

    return;
  } else if (
    mouseX >= canvasLeft2 &&
    mouseX <= canvasLeft2 + stampCanvasWidth2 &&
    mouseY >= canvasTop2 &&
    mouseY <= canvasTop2 + stampCanvasHeight2
  ) {
    console.log("we made it into canvas 2");
    if (currentStroke === null) {
      currentStroke = {
        size: sizeSlider.value,
        color: colorPicker.value,
        shape: penTip, // Store the shape of the brush
        points: [],
      };
      strokes.push(currentStroke);
    }
    let stroke = currentStroke;
    popUpCanvas2.noStroke();
    popUpCanvas2.fill(stroke.color);
    popUpCanvas2.circle(mouseX - canvasLeft2, mouseY - canvasTop2, stroke.size);
    return;
  }
  else if (
    mouseX >= canvasLeft3 &&
    mouseX <= canvasLeft3 + stampCanvasWidth3 &&
    mouseY >= canvasTop3 &&
    mouseY <= canvasTop3 + stampCanvasHeight3
  ) {
    console.log("we made it into canvas 3");
    if (currentStroke === null) {
      currentStroke = {
        size: sizeSlider.value,
        color: colorPicker.value,
        shape: penTip, // Store the shape of the brush
        points: [],
      };
      strokes.push(currentStroke);
    }
    let stroke = currentStroke;
    popUpCanvas3.noStroke();
    popUpCanvas3.fill(stroke.color);
    popUpCanvas3.circle(mouseX - canvasLeft3, mouseY - canvasTop3, stroke.size);
    return;
  }

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
    drawLine(currentStroke.points.length - 2, currentStroke.points.length - 1);
  }
}
function mouseClicked() {
  let x = mouseX;
  let y = mouseY - fontsize;
  console.log("x" + mouseX);
  console.log("y" + mouseY);

  if (penTip === 'Stamp') {
    console.log(selectedStamp);

    if (selectedStamp === 'stamp1') {
      stamp = popUpCanvas1.get();
      gfx.image(stamp, mouseX - stamp.width / 2, mouseY - stamp.height / 2);
      dirty = true;
      console.log("try harder");
    } else if (selectedStamp === 'stamp2') {
      stamp = popUpCanvas2.get();
      gfx.image(stamp, mouseX - stamp.width / 2, mouseY - stamp.height / 2);
      dirty = true;
      console.log("try harder2");
    } else if (selectedStamp === 'stamp3') {
      stamp = popUpCanvas3.get();
      gfx.image(stamp, mouseX - stamp.width / 2, mouseY - stamp.height / 2);
      dirty = true;
      console.log("try harder3");
    }
  }

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

    if (penTip === 'Circle') {
      gfx.circle(endPoint.x, endPoint.y, stroke.size);
    } else if (penTip === 'Square') {
      gfx.square(endPoint.x, endPoint.y, stroke.size);
    } else if (penTip === 'Triangle') {
      let halfSize = stroke.size / 2;
      let angle = atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

      let x1 = endPoint.x + cos(angle) * halfSize;
      let y1 = endPoint.y + sin(angle) * halfSize;
      let x2 = endPoint.x + cos(angle + (2 * PI / 3)) * halfSize;
      let y2 = endPoint.y + sin(angle + (2 * PI / 3)) * halfSize;
      let x3 = endPoint.x + cos(angle + (4 * PI / 3)) * halfSize;
      let y3 = endPoint.y + sin(angle + (4 * PI / 3)) * halfSize;

      gfx.triangle(x1, y1, x2, y2, x3, y3);
    } else if (penTip === 'WaterColor') {
      blob(stroke.color, stroke.size, endPoint.x, endPoint.y);
    }
    else if (penTip === 'Eraser') {
      eraseFun(stroke.size, endPoint.x, endPoint.y);
    }
    // Set the shape property of the current stroke
    stroke.shape = penTip;

    dirty = true;
  }
}
function blob(hue, size, x1, y1) {
  noStroke();

  // TODO: Potential fix on the GFX / TBD 
  for (var i = 0; i <= 2; i++) {
    var rs = random(2.0) - 1.0;

    beginShape();
    for (var a = 0; a <= 360; a += 10) {
      var r = (size * 4) + 25 * noise(a + 9 * rs) * 2 - 1;
      var x = r * cos(a);
      var y = r * sin(a);

      // Calculate alpha value based on the range of a
      let alphaValue = mapRange(a, 0, 360, 0, 5); // Adjust the range of alpha values as needed
      let shapeFillColor = color(hue);
      shapeFillColor.setAlpha(alphaValue);
      fill(shapeFillColor);
      curveVertex(x1 + x, y1 - y);
    }
    endShape();
  }
}
function eraseFun(size, x, y) {
  gfx.erase(255, 255);
  console.log("ERASEFUN")
  gfx.fill('red');
  gfx.circle(x, y, size);
  gfx.noErase();
  clear();
}


// Custom mapping function
function mapRange(value, inputMin, inputMax, outputMin, outputMax) {
  return ((value - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) + outputMin;
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
  gfx.background(0, 0, 0, 0);

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
function changeStamp(temp) {
  selectedStamp = temp;
  console.log(selectedStamp);
}


// Get the pen tip container and active list item
const penTipContainer = document.querySelector('.pen-tip');
let activeListItem = penTipContainer.querySelector('.active');

// Add click event listeners to the list items
var listItems = penTipContainer.querySelectorAll('.list');
listItems.forEach((listItem) => {
  listItem.addEventListener('click', () => {
    // Remove the active class from the previously active list item
    activeListItem.classList.remove('active');

    // Add the active class to the clicked list item
    listItem.classList.add('active');

    // Update the active list item
    activeListItem = listItem;

    // Get the selected pen tip
    let selectedPenTip = listItem.querySelector('.text').textContent;

    // Update the pen tip in your drawing logic or function
    updatePenTip(selectedPenTip);
  });
});

// Function to update the pen tip in your drawing logic
function updatePenTip(selectedPenTip) {
  penTip = selectedPenTip;
  console.log(penTip);
}
function toggleButtons() {
  var additionalButtons = document.getElementById('additionalButtons');
  additionalButtons.style.display = (additionalButtons.style.display === 'none') ? 'grid' : 'none';
}

var stampDropDown = document.getElementById('stamp-dropdown');
stampDropDown.addEventListener("change", function () {
  let changedStamp = stampDropDown.options[stampDropDown.selectedIndex].value;
  console.log("Selected option: " + changedStamp);
  changeStamp(changedStamp);
});



