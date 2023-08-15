/*
AUTHOR: Andrew Goodling 
TIMELINE: May 2023 - August 2023
SUPERVISOR: ERIK FREDERICKS
PROJECT: WALK AND DRAW GVSU
**/

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
const zoomLevel = 17;
let currentLong, currentLat;

let marker;
let currentPosition;
var img;
let prevX, prevY;

/*
setUpMap()
This function loads in the map and its functionalities.
Called from setUp();
**/
function setUpMap(latitude, longitude) {
  mapboxgl.accessToken = mapboxAccessToken;
  console.log("lat: ",latitude, "long: ", longitude);
  map1 = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [longitude, latitude],
    zoom: zoomLevel
  });
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
        'circle-radius': 4,
        'circle-color': 'blue',
        'circle-stroke-width': 2,
        'circle-stroke-color': 'white'
      }
    });
  });
  loopLocation();
}
/*
loopLocation();
This function watches the users location for movement. 
Called from setUpMap(); 
Calls updateDotPosition();
**/
function loopLocation(){
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position => {
      currentLatitude = position.coords.latitude;
      currentLongitude = position.coords.longitude;
      updateDotPosition();
    });
  }
}

/*
updateDotPostion();
longitude/latitude = map center.
currentLongitude/currentLatitude = dot location.
This function updates the users dot location on the map. 
Called from loopLocation();
**/

function updateDotPosition() {
  map1.getSource('current-location').setData({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [currentLongitude, currentLatitude]
    }
  })
}
loopLocation();
 
/*
trackUserLocation();
This promise holds until the user accepts the tracking services and the device finds the location.
Called from setUp();
**/
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
/*
setUp();
This function is called at every opening of the application. 
Called from device open;
Calls trackUserLocation and sets up the canvases/ stamp canvases / functionality.
**/
function setup() {
  windowScale = DIM / 1000;
  fontsize = 24 * windowScale;
  penTip = 'Circle';

  var canvas = createCanvas(windowWidth, windowHeight-100);
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

  let CreateCanvases = createStampCanvases();
  frameRate(60);
  alert("Welcome to GVSU Walk and Draw! Complete your drawings on screen BEFORE you use the watercolor brush to shade! Enjoy!");

  //btnSave = document.getElementById('btnSave');
  btnClear = document.getElementById('btnClear');
  colorPicker = document.getElementById('colorPicker');
  sizeSlider = document.getElementById('sizeSlider');
  colorPicker.addEventListener('input', changeStroke);
  sizeSlider.addEventListener('input', changeStroke);
  let stampDropDown = document.getElementById('stamp-dropdown');
  gfx.noStroke();

  //createMapDrag(windowWidth,windowHeight);

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

function createMapDrag(width,height){
  let topPointWidth = width - 200;
  let topPointHeight = height - 200;
  gfx.background(255,255,255);
  gfx.square(0,0,-10);
  
}

/*
createStampCanvases();
This function creates and sets up all bounding for the three stamp canvases.
Called from setUp()
**/
function createStampCanvases() {
  // SETUP STAMP 1
  popUpCanvasElement1 = document.getElementById("stampcanvas1");

  computedStyle1 = window.getComputedStyle(popUpCanvasElement1);

  // Get the width and height values from the computed style for STAMP1
  stampCanvasWidth1 = parseInt(computedStyle1.getPropertyValue("width"), 10);
  stampCanvasHeight1 = parseInt(computedStyle1.getPropertyValue("height"), 10);
  canvasRect1 = popUpCanvasElement1.getBoundingClientRect();

  // Get the canvas position relative to the document
  canvasLeft1 = canvasRect1.left + window.scrollX;
  canvasTop1 = canvasRect1.top + window.scrollY;

  popUpCanvas1 = createGraphics(stampCanvasWidth1, stampCanvasHeight1);
  popUpCanvas1.position(canvasLeft1, canvasTop1);
  popUpCanvas1.style("z-index", "2");

  // SETUP STAMP 2
  popUpCanvasElement2 = document.getElementById("stampcanvas2");

  computedStyle2 = window.getComputedStyle(popUpCanvasElement2);

  // Get the width and height values from the computed style for STAMP2
  stampCanvasWidth2 = parseInt(computedStyle2.getPropertyValue("width"), 10);
  stampCanvasHeight2 = parseInt(computedStyle2.getPropertyValue("height"), 10);
  canvasRect2 = popUpCanvasElement2.getBoundingClientRect();

  // Get the canvas position relative to the document
  canvasLeft2 = canvasRect2.left + window.scrollX;
  canvasTop2 = canvasRect2.top + window.scrollY;

  popUpCanvas2 = createGraphics(stampCanvasWidth2, stampCanvasHeight2);
  popUpCanvas2.position(canvasLeft2, canvasTop2);
  popUpCanvas2.style("z-index", "2");

  // SETUP STAMP 3
  popUpCanvasElement3 = document.getElementById("stampcanvas3");

  computedStyle3 = window.getComputedStyle(popUpCanvasElement3);

  // Get the width and height values from the computed style for STAMP3
  stampCanvasWidth3 = parseInt(computedStyle3.getPropertyValue("width"), 10);
  stampCanvasHeight3 = parseInt(computedStyle3.getPropertyValue("height"), 10);
  canvasRect3 = popUpCanvasElement3.getBoundingClientRect();

  // Get the canvas position relative to the document
  canvasLeft3 = canvasRect3.left + window.scrollX;
  canvasTop3 = canvasRect3.top + window.scrollY;

  popUpCanvas3 = createGraphics(stampCanvasWidth3, stampCanvasHeight3);
  popUpCanvas3.position(canvasLeft3, canvasTop3);
  popUpCanvas3.style("z-index", "2");

}
/*
draw();
This function is continuously called by the software and draws the drawing to the main canvas.

**/
function draw() {
  if (dirty) {
    image(gfx, 0, 24);
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
/*
saveImg();
WORKING active
**/
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
/*
clearImg();
This clears the canvas.
Called from clear Button action listener.
**/
function clearImg() {
  dirty = true;
  console.log("Clear");
  gfx.clear();
  strokes = [];
  savedStrokes = [];
  clear();
}
/*
changeStroke();
This changes the current stroke to a new updated stroke type.
**/
function changeStroke() {
  if (currentStroke !== null) {
    currentStroke.size = sizeSlider.value;
    currentStroke.color = colorPicker.value;
    dirty = true;
  }
}
/*
isInsideCanvas1();
Returns a boolean if the mouse is on canvas 1.
x and y are mouse coordinates.
Called from MouseDragged
**/
function isInsideCanvas1(x, y) {
  return (
    x >= canvasLeft1 &&
    x <= canvasLeft1 + stampCanvasWidth1 &&
    y >= canvasTop1 &&
    y <= canvasTop1 + stampCanvasHeight1
  );
}

/*
isInsideCanvas2();
Returns a boolean if the mouse is on canvas 2.
x and y are mouse coordinates.
**/
function isInsideCanvas2(x, y) {
  return (
    x >= canvasLeft2 &&
    x <= canvasLeft2 + stampCanvasWidth2 &&
    y >= canvasTop2 &&
    y <= canvasTop2 + stampCanvasHeight2
  );
}

/*
isInsideCanvas3();
Returns a boolean if the mouse is on canvas 3.
x and y are mouse coordinates.

**/
function isInsideCanvas3(x, y) {
  return (
    x >= canvasLeft3 &&
    x <= canvasLeft3 + stampCanvasWidth3 &&
    y >= canvasTop3 &&
    y <= canvasTop3 + stampCanvasHeight3
  );
}

/*
mouseDragged();
This function is called when a mouse is dragged on the screen. Goes between main canvas and stamping canvase.
Calls all checks to stamps, along with drawin on different graphics objects.
**/
function mouseDragged() {
  let x = mouseX;
  let y = mouseY - fontsize;
  
  if (isInteracting) {
    return;
  }

  // Check if the mouse is inside the canvas area for drawing
  if (isInsideCanvas1(x, y)) {
    //console.log("we made it into canvas 1");
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
    clickOnCanvas1(stroke);
    return;
    }
   
    else if (isInsideCanvas2(x, y)) {
      //console.log("we made it into canvas 2");
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
      clickOnCanvas2(stroke);
      return;
    }
   else if (isInsideCanvas3(x, y)) {
    //console.log("we made it into canvas 3");
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
    clickOnCanvas3(stroke);
    return;
  }

  if (y > fontsize) {
    if (currentStroke === null) {
      currentStroke = {
        size: sizeSlider.value,
        color: colorPicker.value,
        shape: penTip,
        points: [],
      };
      strokes.push(currentStroke);
    }

    if (!prevX || dist(x, y, prevX, prevY) > 0) {
      currentStroke.points.push({ x: x, y: y });
      drawLine(currentStroke.points.length - 2, currentStroke.points.length - 1);
      prevX = x;
      prevY = y;
    }
  }
}
/*
mouseClicked();
This function is called when a mouse is clicked. Differentiates between stamp and main canvas.
Calls from a mouse click on screen.
**/
function mouseClicked() {
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
    drawLine(currentStroke.points.length - 2, currentStroke.points.length - 1);
  }
  let stroke = currentStroke;
  if (check()) {
    if (penTip === 'Stamp') {

      if (selectedStamp === 'stamp1') {
        stamp = popUpCanvas1.get();
        gfx.image(stamp, mouseX - stamp.width / 4, mouseY - stamp.height / 4,50,50); //(IMG,x,y,width,height)
        dirty = true;
      } else if (selectedStamp === 'stamp2') {
        stamp = popUpCanvas2.get();
        gfx.image(stamp, mouseX - stamp.width / 4, mouseY - stamp.height / 4,50,50);
        dirty = true;
      } else if (selectedStamp === 'stamp3') {
        stamp = popUpCanvas3.get();
        gfx.image(stamp, mouseX - stamp.width / 4, mouseY - stamp.height / 4,50,50);
        dirty = true;
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
     
      gfx.triangle(x1, y1, x2, y2, x3, y3);
    } else if (penTip === 'WaterColor') {
      console.log("NO");
    }
  }
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
  stroke.shape = penTip;

  dirty = true;
}
/*
check();
Called from mouseClicked. Returns true along with a value of canvasClickSelection. If the mouse is clicked onto a canvas.
**/
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
/*
clickOnCanvas1();
This function is called from the switch statement at the bottom of mouseClicked(),
The value determines which function of clickOnCanvas() is called;
**/
function clickOnCanvas1(stroke1) {
  let stroke = stroke1;
  popUpCanvas1.strokeWeight(stroke.size);
  popUpCanvas1.stroke(stroke.color);
  //console.log("canvas 1 click working");


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
    popUpCanvas1.triangle(x1 - canvasLeft1, y1 - canvasTop1, x2 - canvasLeft1, y2 - canvasTop1, x3 - canvasLeft1, y3 - canvasTop1);
  }
  stroke.shape = penTip;
  dirty = true;

}
/*
clickOnCanvas2();
This function is called from the switch statement at the bottom of mouseClicked(),
The value determines which function of clickOnCanvas() is called;
**/
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
/*
clickOnCanvas3();
This function is called from the switch statement at the bottom of mouseClicked(),
The value determines which function of clickOnCanvas() is called;
**/
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
/*
drawLine();
This Function is called from mouseClicked() and mouseDragged().
Determines the shape, size, and color and displays it to the gfx screen. 
**/
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
      blob(stroke.color,3, stroke.size, endPoint.x, endPoint.y);
    }
    else if (penTip === 'Eraser') {
      eraseFun(stroke.size, endPoint.x, endPoint.y);
    }
    // Set the shape property of the current stroke
    stroke.shape = penTip;

    dirty = true;
  }
}
/*
blob();
This function is called from drawLine().
Responsible for the math behind the watercolor brush. 
**/
function blob(hue, alpha, size, x1, y1) {
  noStroke();

  // TODO: Potential fix on the GFX / TBD 
  for (var i = 0; i <= 2; i++) {
    var rs = random(2.0) - 1.0;
    //console.log("3");

    beginShape();
    for (var a = 0; a <= 360; a += 10) {
      var r = (size * 4) + 25 * noise(a + 9 * rs) * 2 - 1;
      var x = r * cos(a);
      var y = r * sin(a);

      // Calculate alpha value based on the range of a
      let alphaValue = mapRange(a, 0, 360, 0, alpha); // Use the alpha parameter here
      let shapeFillColor = color(hue);
      shapeFillColor.setAlpha(alphaValue);
      fill(shapeFillColor);
      curveVertex(x1 + x, y1 - y);
    }
    endShape(CLOSE);
  }
}

/*
eraseFun();
This function is called from drawLine().
Responsible for the eraser tool.
**/
function eraseFun(size, x, y) {
  gfx.erase(255, 255);
  gfx.fill('red');
  gfx.circle(x, y, size);
  gfx.noErase();
  clear();
}


/*
mapRange();
This function is called from blob();
Calculates the alpha value for the waterColor opacity.
**/
function mapRange(value, inputMin, inputMax, outputMin, outputMax) {
  return ((value - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) + outputMin;
}

/*
mouseReleased();
This function is called when the mouse is released. 
Resets the current stroke to NULL. 
**/
function mouseReleased() {
  if (currentStroke !== null) {
    strokes.push(currentStroke);
    currentStroke = null;
    savedStrokes = []; // Clear the savedStrokes array
  }
}

/*
redrawCanvas();
POTENTIALLY NOT USED..?

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
**/
/*
changeStamp();
Just changes the stamp.
**/
function changeStamp(temp) {
  selectedStamp = temp;
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

