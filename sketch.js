// font: https://fonts.google.com/specimen/Nerko+One
// https://support.google.com/chrome/thread/20108907/how-to-stop-desktop-browser-chrome-from-interpreting-my-wacom-tablet-as-a-touchscreen?hl=en

let strokes = [];
let savedStrokes = [];
let currentStroke = null;
let gfx, stampGFX;
let debounceDelay = 0; //15;
let debounce = 0;
let font, fontsize;
let windowScale;
let dirty = true;
let colorPicker, sizeSlider;
let btnSave, btnClear, btnUndo, btnRedo;
let eraseEnable = false;
let isInteracting = false;
//stamp canvas things
let popUpCanvas1, popUpCanvasElement1, computedStyle1, stampCanvasWidth1, stampCanvasHeight1;
let popUpCanvas2, popUpCanvasElement2, computedStyle2, stampCanvasWidth2, stampCanvasHeight2;
let popUpCanvas3, popUpCanvasElement3, computedStyle3, stampCanvasWidth3, stampCanvasHeight3;
let canvasRect1, canvasLeft1, canvasTop1;
let canvasRect2, canvasLeft2, canvasTop2;
let canvasRect3, canvasLeft3, canvasTop3;
let canvasClickSelectionLabel;
let selectedStamp;
let stamp = 'stamp1';
let backgroundColor = "#FFFFFF"; // Initial background color (white)
const DIM = 1000;
//map things
let penTip;
let map1;
const mapboxAccessToken = 'pk.eyJ1IjoiZ29vZGxpbmEiLCJhIjoiY2xpM2F2ZGlpMGxseDNnbnRqMWl1c3A3bCJ9.WMJlwaLWmoNc-YuSv-92Ow';
let hollandLatitude = 42.78;
let hollandLongitude = -86.1089;
const zoomLevel = 14;
let currentLong, currentLat;

let marker;
let currentPosition;
var img;


function setUpMap(latitude, longitude) {
  mapboxgl.accessToken = mapboxAccessToken;
  console.log("lat: ",latitude, "long: ", longitude);
  map1 = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [longitude, latitude],
    zoom: zoomLevel
  });
  //this all goes together
  map1.on('load', () => {
    map1.addSource('current-location', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      }
    });

    map1.addLayer({
      id: 'current-location',
      type: 'circle',
      source: 'current-location',
      paint: {
        'circle-radius': 8,
        'circle-color': 'green',
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white'
      }
    });
  });
  //to here
  loopLocation();
}

function loopLocation(){
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position => {
      currentLatitude = position.coords.latitude;
      currentLongitude = position.coords.longitude;
      updateDotPosition();
    });
  }
}
//longitude and latitude are measurements for the map to be centered.
//currentLongitude and currentLatitude are the ones for the dot specifically

function updateDotPosition() {
  map1.getSource('current-location').setData({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [currentLongitude, currentLatitude]
    }
  })
  console.log("lat: ",currentLatitude, "long: ", currentLongitude);

}
loopLocation();
 

function trackUserLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          resolve({ latitude, longitude });
        },
        (error) => {
          reject(error.message);
        }
      );
    } else {
      reject("Geolocation is not supported by this browser.");
    }
  });
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

  //let titleWidth = drawHeader();

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

//promise for users location
  trackUserLocation()
    .then((locationData) => {
      const { latitude, longitude } = locationData;
      console.log("before send" + latitude + longitude);
      setUpMap(latitude, longitude);
    }).catch((error) => {
      console.error("Error getting the users location", error);
    });
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

function draw() {
  if (dirty) {
    //background();
    image(gfx, 0, 24);
    //drawHeader();
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
  const canvas = document.getElementById('canvas')
  // Get references to the canvas element and "Save" button
const saveButton = document.getElementById("btnSave");

// Get the 2D context of the canvas
const ctx = canvas.getContext("2d");

// Your existing code for drawing on the canvas goes here
// ...

// Function to handle "Save" button click
saveButton.addEventListener("click", () => {
  // Get the data URL of the canvas content (PNG format by default)
  const dataURL = canvas.toDataURL();

  // Create a new Image object
  const image = new Image();

  // Set the source of the Image to the data URL
  image.src = dataURL;

  // Create a new anchor element
  const anchor = document.createElement("a");

  // Set the href attribute to the data URL
  anchor.href = dataURL;

  // Set the download attribute to suggest a filename for the download
  anchor.download = "drawing.png";

  // Add an event listener to load the image and trigger the download
  anchor.addEventListener("click", () => {
    // Draw the image on a new canvas to ensure correct aspect ratio and resolution
    const newCanvas = document.createElement("canvas");
    const newCtx = newCanvas.getContext("2d");
    newCanvas.width = image.width;
    newCanvas.height = image.height;
    newCtx.drawImage(image, 0, 0, image.width, image.height);

    // Convert the canvas to a Blob (binary data)
    newCanvas.toBlob((blob) => {
      // Create a new FormData object to hold the Blob data
      const formData = new FormData();
      formData.append("image", blob, "drawing.png");

      // Use the Web Share API to allow the user to save the image to the Photos app
      if (navigator.share && navigator.canShare({ files: [blob] })) {
        navigator.share({
          files: [formData],
        });
      } else {
        // Fallback for browsers that do not support Web Share API
        alert("Sorry, your device does not support saving to Photos.");
      }
    });
  });

  // Programmatically click the anchor element to initiate the download
  anchor.click();
});

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

function mouseDragged() {
  let x = mouseX;
  let y = mouseY - fontsize;
  // Draw on the pop-up canvas while dragging the mouse
  console.log(isInteracting);
  if (isInteracting) {
    return;
  }
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

    if (penTip === 'Eraser') {
      popUpCanvas1.erase(255, 255);
      popUpCanvas1.circle(x, y, 10);
      popUpCanvas1.noErase();
      popUpCanvas1.clear();
      clear();
      dirty = true;
      return;
    }
    //popUpCanvas1.noStroke();
    //popUpCanvas1.fill(stroke.color);
    // popUpCanvas1.circle(mouseX - canvasLeft1, mouseY - canvasTop1, stroke.size);
    clickOnCanvas1(stroke);

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
    if (penTip === 'Eraser') {
      popUpCanvas2.erase(255, 255);
      popUpCanvas2.circle(x, y, 10);
      popUpCanvas2.noErase();
      popUpCanvas2.clear();
      clear();
      dirty = true;
      return;
    }
    //popUpCanvas2.noStroke();
    //popUpCanvas2.fill(stroke.color);
    //popUpCanvas2.circle(mouseX - canvasLeft2, mouseY - canvasTop2, stroke.size);
    clickOnCanvas2(stroke);
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
    if (penTip === 'Eraser') {
      popUpCanvas3.erase(255, 255);
      popUpCanvas3.circle(x, y, 10);
      popUpCanvas3.noErase();
      popUpCanvas3.clear();
      clear();
      dirty = true;
      return;
    }
    //popUpCanvas3.noStroke();
    //popUpCanvas3.fill(stroke.color);
    // popUpCanvas3.circle(mouseX - canvasLeft3, mouseY - canvasTop3, stroke.size);
    clickOnCanvas3(stroke);
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

    console.log("1");
    currentStroke.points.push({ x: x, y: y });
    drawLine(currentStroke.points.length - 2, currentStroke.points.length - 1);
  }
}
function mouseClicked() {
  let x = mouseX;
  let y = mouseY - fontsize;
  console.log("x" + mouseX);
  console.log("y" + mouseY);

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
  let stroke = currentStroke;
  if (check()) {
    console.log("canvas selection: " + canvasClickSelectionLabel);
    if (penTip === 'Stamp') {
      console.log(selectedStamp);
      //console.log(canvasClickSelectionLabel + "HELLO");

      if (selectedStamp === 'stamp1') {
        stamp = popUpCanvas1.get();
        gfx.image(stamp, mouseX - stamp.width / 2, mouseY - stamp.height / 2);
        dirty = true;
        //console.log("try harder");
      } else if (selectedStamp === 'stamp2') {
        stamp = popUpCanvas2.get();
        gfx.image(stamp, mouseX - stamp.width / 2, mouseY - stamp.height / 2);
        dirty = true;
        //console.log("try harder2");
      } else if (selectedStamp === 'stamp3') {
        stamp = popUpCanvas3.get();
        gfx.image(stamp, mouseX - stamp.width / 2, mouseY - stamp.height / 2);
        dirty = true;
        //console.log("try harder3");
      }

    } else if (penTip === 'Circle') {
      console.log("mouseclick circle");
      gfx.circle(x, y, stroke.size);
    } else if (penTip === 'Square') {
      gfx.square(x, y, stroke.size);
    } else if (penTip === 'Triangle') {
      let moving = stroke.size / 1.2;

      let x1 = x;
      let y1 = y - moving;
      let x2 = x + moving;
      let y2 = y + moving;
      let x3 = x - moving;
      let y3 = y + moving;
      //console.log(stroke.size + " SIZE");
      //console.log( "x1:"+ x1 + " y1:" +y1 + "    x2:"+ x2 + " y2:" +y2 + "    x3:"+ x3 + " y3:" +y3 );

      gfx.triangle(x1, y1, x2, y2, x3, y3);
    } else if (penTip === 'WaterColor') {
      console.log("NO");
    }
  }
  console.log(canvasClickSelectionLabel + " before");
  switch (canvasClickSelectionLabel) {
    case 1: clickOnCanvas1(currentStroke);
      canvasClickSelectionLabel = 0;
      break;
    case 2: clickOnCanvas2(currentStroke);
      canvasClickSelectionLabel = 0;
      break;
    case 3: clickOnCanvas3(currentStroke);
      canvasClickSelectionLabel = 0;
      break;
    default:
      break;
  }
  console.log("after: " + canvasClickSelectionLabel);
  // Set the shape property of the current stroke
  stroke.shape = penTip;

  dirty = true;
}
function check() {
  if (
    mouseX >= canvasLeft1 &&
    mouseX <= canvasLeft1 + stampCanvasWidth1 &&
    mouseY >= canvasTop1 &&
    mouseY <= canvasTop1 + stampCanvasHeight1) {
    canvasClickSelectionLabel = 1;
    return false;
  }
  else if (
    mouseX >= canvasLeft2 &&
    mouseX <= canvasLeft2 + stampCanvasWidth2 &&
    mouseY >= canvasTop2 &&
    mouseY <= canvasTop2 + stampCanvasHeight2) {
    canvasClickSelectionLabel = 2;
    return false;
  }
  else if (
    mouseX >= canvasLeft3 &&
    mouseX <= canvasLeft3 + stampCanvasWidth3 &&
    mouseY >= canvasTop3 &&
    mouseY <= canvasTop3 + stampCanvasHeight3) {
    canvasClickSelectionLabel = 3;
    return false;
  } else
    return 4;
}
function clickOnCanvas1(stroke1) {
  let stroke = stroke1;
  popUpCanvas1.strokeWeight(stroke.size);
  popUpCanvas1.stroke(stroke.color);
  console.log("canvas 1 click working");


  if (penTip === 'Circle') {
    console.log("mouseclick circle");
    popUpCanvas1.circle(mouseX - canvasLeft1, mouseY - canvasTop1, stroke.size);
  } else if (penTip === 'Square') {
    popUpCanvas1.square(mouseX - canvasLeft1, mouseY - canvasTop1, stroke.size);
  } else if (penTip === 'Triangle') {
    let moving = stroke.size / 1.2;

    let x1 = mouseX;
    let y1 = mouseY - moving;
    let x2 = mouseX + moving;
    let y2 = mouseY + moving;
    let x3 = mouseX - moving;
    let y3 = mouseY + moving;
    //console.log(stroke.size + " SIZE");
    //console.log( "x1:"+ x1 + " y1:" +y1 + "    x2:"+ x2 + " y2:" +y2 + "    x3:"+ x3 + " y3:" +y3 );

    popUpCanvas1.triangle(x1 - canvasLeft1, y1 - canvasTop1, x2 - canvasLeft1, y2 - canvasTop1, x3 - canvasLeft1, y3 - canvasTop1);
  }
  stroke.shape = penTip;
  dirty = true;

}
function clickOnCanvas2(stroke2) {
  let stroke = stroke2;
  popUpCanvas2.strokeWeight(stroke.size);
  popUpCanvas2.stroke(stroke.color);
  console.log("canvas 2 click working");


  if (penTip === 'Circle') {
    console.log("mouseclick circle");
    popUpCanvas2.circle(mouseX - canvasLeft2, mouseY - canvasTop2, stroke.size);
  } else if (penTip === 'Square') {
    popUpCanvas2.square(mouseX - canvasLeft2, mouseY - canvasTop2, stroke.size);
  } else if (penTip === 'Triangle') {
    let moving = stroke.size / 1.2;

    let x1 = mouseX;
    let y1 = mouseY - moving;
    let x2 = mouseX + moving;
    let y2 = mouseY + moving;
    let x3 = mouseX - moving;
    let y3 = mouseY + moving;
    //console.log(stroke.size + " SIZE");
    //console.log( "x1:"+ x1 + " y1:" +y1 + "    x2:"+ x2 + " y2:" +y2 + "    x3:"+ x3 + " y3:" +y3 );

    popUpCanvas2.triangle(x1 - canvasLeft2, y1 - canvasTop2, x2 - canvasLeft2, y2 - canvasTop2, x3 - canvasLeft2, y3 - canvasTop2);
  }
  stroke.shape = penTip;
  dirty = true;

}
function clickOnCanvas3(stroke3) {
  let stroke = stroke3;
  popUpCanvas3.strokeWeight(stroke.size);
  popUpCanvas3.stroke(stroke.color);
  console.log("canvas 3 click working");


  if (penTip === 'Circle') {
    console.log("mouseclick circle");
    popUpCanvas3.circle(mouseX - canvasLeft3, mouseY - canvasTop3, stroke.size);
  } else if (penTip === 'Square') {
    popUpCanvas3.square(mouseX - canvasLeft3, mouseY - canvasTop3, stroke.size);
  } else if (penTip === 'Triangle') {
    let moving = stroke.size / 1.2;

    let x1 = mouseX;
    let y1 = mouseY - moving;
    let x2 = mouseX + moving;
    let y2 = mouseY + moving;
    let x3 = mouseX - moving;
    let y3 = mouseY + moving;
    //console.log(stroke.size + " SIZE");
    //console.log( "x1:"+ x1 + " y1:" +y1 + "    x2:"+ x2 + " y2:" +y2 + "    x3:"+ x3 + " y3:" +y3 );

    popUpCanvas3.triangle(x1 - canvasLeft3, y1 - canvasTop3, x2 - canvasLeft3, y2 - canvasTop3, x3 - canvasLeft3, y3 - canvasTop3);
  }
  stroke.shape = penTip;
  dirty = true;

}


function drawLine(startIndex, endIndex) {
  let stroke = currentStroke;
  gfx.strokeWeight(stroke.size);
  gfx.stroke(stroke.color);
  console.log("pentip: " + penTip);

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
    } else if (penTip === 'Water') {
      console.log("2");
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
    console.log("3");

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

// Add event listeners to buttons and sliders to track touch interactions

function checkInteractions(event) {
  // Check if the event target is a button or slider
  const target = event.target;
  if (target.tagName === 'BUTTON' || target.tagName === 'INPUT') {
    isInteracting = true;
  } else {
    isInteracting = false;
  }
}

// Add event listeners for touch events to track interactions
document.addEventListener('touchstart', checkInteractions, true);
document.addEventListener('touchend', checkInteractions, true);

// Add event listeners for mouse events to track interactions (for desktop)
document.addEventListener('mousedown', checkInteractions, true);
document.addEventListener('mouseup', checkInteractions, true);

