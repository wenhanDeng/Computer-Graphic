//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda AND
// Chapter 2: ColoredPoints.js (c) 2012 matsuda
//
// merged and modified to became:
//
// ControlMulti.js for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

//		--converted from 2D to 4D (x,y,z,w) vertices
//		--demonstrate how to keep & use MULTIPLE colored shapes 
//			in just one Vertex Buffer Object(VBO).
//		--demonstrate several different user I/O methods: 
//				--Webpage pushbuttons 
//				--Webpage edit-box text, and 'innerHTML' for text display
//				--Mouse click & drag within our WebGL-hosting 'canvas'
//				--Keyboard input: alphanumeric + 'special' keys (arrows, etc)
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variables
// =========================
// Use globals to avoid needlessly complex & tiresome function argument lists,
// and for user-adjustable controls.
// For example, the WebGL rendering context 'gl' gets used in almost every fcn;
// requiring 'gl' as an argument won't give us any added 'encapsulation'; make
// it global.  Later, if the # of global vars grows too large, we can put them 
// into one (or just a few) sensible global objects for better modularity.
//------------For WebGL-----------------------------------------------
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');  
g_canvas.width = window.innerWidth;
g_canvas.height = window.innerHeight * 0.7;   
                  // our HTML-5 canvas object that uses 'gl' for drawing.
// Global Variables
var ANGLE_STEP = 45.0;		// Rotation angle rate (degrees/second)
var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex
                  
// ----------For tetrahedron & its matrix---------------------------------
var g_vertsMax = 0;                 // number of vertices held in the VBO 
                                    // (global: replaces local 'n' variable)
var g_modelMatrix = new Matrix4();  // Construct 4x4 matrix; contents get sent
                                    // to the GPU/Shaders as a 'uniform' var.
var g_modelMatLoc;                  // that uniform's location in the GPU

//------------For Animation---------------------------------------------
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 
                                    // in milliseconds; used by 'animate()' fcn 
                                    // (now called 'timerAll()' ) to find time
                                    // elapsed since last on-screen image.
var g_angle01 = 0;                  // initial rotation angle
var g_angle01Rate = 45.0;           // rotation speed, in degrees/second 

var g_angle02 = 0;                  // initial rotation angle
var g_angle02Rate = 40.0;           // rotation speed, in degrees/second 

var g_angle03 = 0;                  // 3
var g_angle03Rate = 70.0;  

var g_shift01 = 0;               
var g_shift01Rate = 0.2;  

var g_angle04 = 0;                  // 4
var g_angle04Rate = 20.0;  

var g_angle05 = 0;                  // 4
var g_angle05Rate = -20.0;  

var g_angle06 = 0;                  // 4
var g_angle06Rate = 30.0;  

var g_angle07 = 0;                  // 4
var g_angle07Rate = -30.0;  

var g_shift02 = 0;   

var g_angle08 = 0;                  // 4
var g_angle08Rate = 40.0;  

var g_angle09 = 0;                  // 4
var g_angle09Rate = -40.0;  

var g_shift03 = 0;               
var g_shift03Rate = 0.25;  

eyex = 7.375579238401635;
eyey = -7.77124752565902;
eyez = 2.301515759411268;
lookatx = 4.071411392510663;
lookaty = -4.07978187395098;
lookatz = 1.461037596438066;

     
rad = Math.sqrt((lookatx - eyex) * (lookatx - eyex) + (lookaty - eyey) * (lookaty - eyey));
theta = 40



//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0; 
var g_digits=5;			// DIAGNOSTICS: # of digits to print in console.log (
									//    console.log('xVal:', xVal.toFixed(g_digits)); // print 5 digits

var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1);	// 'current' orientation (made from qNew)
var quatMatrix = new Matrix4();				// rotation matrix, made from latest qTot
								 

function main() {
//==============================================================================
/*REPLACED THIS: 
// Retrieve <canvas> element:
 var canvas = document.getElementById('webgl'); 
//with global variable 'g_canvas' declared & set above.
*/
  
  // Get gl, the rendering context for WebGL, from our 'g_canvas' object
  gl = getWebGLContext(g_canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Initialize a Vertex Buffer in the graphics system to hold our vertices
  g_maxVerts = initVertexBuffer(gl);  
  if (g_maxVerts < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

	// Register the Keyboard & Mouse Event-handlers------------------------------
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system create a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
  // KEYBOARD:
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
	window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function.  The 'false' 
	// arg (default) ensures myKeyDown() call in 'bubbling', not 'capture' stage)
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
	// Called when user RELEASES the key.  Now rarely used...

	// MOUSE:
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
	window.addEventListener("dblclick", myMouseDblClick); 
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, try:
	// g_canvasID.addEventListener("click", myCanvasClick);
  //
	// Wait wait wait -- these 'mouse listeners' just NAME the function called 
	// when the event occurs!   How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	// END Keyboard & Mouse Event-Handlers---------------------------------------
	
  // Specify the color for clearing <canvas>
  gl.clearColor(0.2, 0.2, 0.3, 1.0);


	
  // Get handle to graphics system's storage location of u_ModelMatrix
  g_modelMatLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!g_modelMatLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
/* REPLACED by global var 'g_ModelMatrix' (declared, constructed at top)
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
*/
/* REPLACED by global g_angle01 variable (declared at top)
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;
*/

  // ANIMATION: create 'tick' variable whose value is this function:
  //----------------- 
  var tick = function() {
    animate();   // Update the rotation angle
    DrawProjB();   // Draw all parts
//    console.log('g_angle01=',g_angle01.toFixed(g_digits)); // put text in console.

//	Show some always-changing text in the webpage :  
//		--find the HTML element called 'CurAngleDisplay' in our HTML page,
//			 	(a <div> element placed just after our WebGL 'canvas' element)
// 				and replace it's internal HTML commands (if any) with some
//				on-screen text that reports our current angle value:
//		--HINT: don't confuse 'getElementByID() and 'getElementById()
		
		//--------------------------------
    requestAnimationFrame(tick, g_canvas);   
    									// Request that the browser re-draw the webpage
    									// (causes webpage to endlessly re-draw itself)
  };
  tick();							// start (and continue) animation: draw current image
	
}
function makeSphere() {
	//==============================================================================
	// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
	// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
	// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
	// sphere from one triangle strip.
	  var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
												// (choose odd # or prime# to avoid accidental symmetry)
	  var sliceVerts	= 27;	// # of vertices around the top edge of the slice
												// (same number of vertices on bottom of slice, too)
	  var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
	  var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
	  var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
	  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.
	
		// Create a (global) array to hold this sphere's vertices:
	  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
											// # of vertices * # of elements needed to store them. 
											// each slice requires 2*sliceVerts vertices except 1st and
											// last ones, which require only 2*sliceVerts-1.
											
		// Create dome-shaped top slice of sphere at z=+1
		// s counts slices; v counts vertices; 
		// j counts array elements (vertices * elements per vertex)
		var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
		var sin0 = 0.0;
		var cos1 = 0.0;
		var sin1 = 0.0;	
		var j = 0;							// initialize our array index
		var isLast = 0;
		var isFirst = 1;
		for(s=0; s<slices; s++) {	// for each slice of the sphere,
			// find sines & cosines for top and bottom of this slice
			if(s==0) {
				isFirst = 1;	// skip 1st vertex of 1st slice.
				cos0 = 1.0; 	// initialize: start at north pole.
				sin0 = 0.0;
			}
			else {					// otherwise, new top edge == old bottom edge
				isFirst = 0;	
				cos0 = cos1;
				sin0 = sin1;
			}								// & compute sine,cosine for new bottom edge.
			cos1 = Math.cos((s+1)*sliceAngle);
			sin1 = Math.sin((s+1)*sliceAngle);
			// go around the entire slice, generating TRIANGLE_STRIP verts
			// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
			if(s==slices-1) isLast=1;	// skip last vertex of last slice.
			for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
				if(v%2==0)
				{				// put even# vertices at the the slice's top edge
								// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
								// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
					sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
					sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
					sphVerts[j+2] = cos0;		
					sphVerts[j+3] = 1.0;			
				}
				else { 	// put odd# vertices around the slice's lower edge;
								// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
								// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
					sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
					sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
					sphVerts[j+2] = cos1;																				// z
					sphVerts[j+3] = 1.0;																				// w.		
				}
				if(s==0) {	// finally, set some interesting colors for vertices:
					sphVerts[j+4]=topColr[0]; 
					sphVerts[j+5]=topColr[1]; 
					sphVerts[j+6]=topColr[2];	
					}
				else if(s==slices-1) {
					sphVerts[j+4]=botColr[0]; 
					sphVerts[j+5]=botColr[1]; 
					sphVerts[j+6]=botColr[2];	
				}
				else {
						sphVerts[j+4]=Math.random();// equColr[0]; 
						sphVerts[j+5]=Math.random();// equColr[1]; 
						sphVerts[j+6]=Math.random();// equColr[2];					
				}
			}
		}
	}
	
function makeGroundGrid() {
	//==============================================================================
	// Create a list of vertices that create a large grid of lines in the x,y plane
	// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.
	
		var xcount = 100;			// # of lines to draw in x,y to make the grid.
		var ycount = 100;		
		var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
		 var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
		 var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
		 
		// Create an (global) array to hold this ground-plane's vertices:
		gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
							// draw a grid made of xcount+ycount lines; 2 vertices per line.
							
		var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
		var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
		
		// First, step thru x values as we make vertical lines of constant-x:
		for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
			if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
				gndVerts[j  ] = -xymax + (v  )*xgap;	// x
				gndVerts[j+1] = -xymax;								// y
				gndVerts[j+2] = 0.0;									// z
				gndVerts[j+3] = 1.0;									// w.
			}
			else {				// put odd-numbered vertices at (xnow, +xymax, 0).
				gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
				gndVerts[j+1] = xymax;								// y
				gndVerts[j+2] = 0.0;									// z
				gndVerts[j+3] = 1.0;									// w.
			}
			gndVerts[j+4] = 0.5;			// red
			gndVerts[j+5] = 0.8;			// grn
			gndVerts[j+6] = 0.33;			// blu
		}
		// Second, step thru y values as wqe make horizontal lines of constant-y:
		// (don't re-initialize j--we're adding more vertices to the array)
		for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
			if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
				gndVerts[j  ] = -xymax;								// x
				gndVerts[j+1] = -xymax + (v  )*ygap;	// y
				gndVerts[j+2] = 0.0;									// z
				gndVerts[j+3] = 1.0;									// w.
			}
			else {					// put odd-numbered vertices at (+xymax, ynow, 0).
				gndVerts[j  ] = xymax;								// x
				gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
				gndVerts[j+2] = 0.0;									// z
				gndVerts[j+3] = 1.0;									// w.
			}
			gndVerts[j+4] = 0.4;			// red
			gndVerts[j+5] = 0.66;			// grn
			gndVerts[j+6] = 0.78;			// blu
		}
	}

function makeCylinder() {
		//==============================================================================
		// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
		// 'stepped spiral' design described in notes.
		// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
		//
		 var ctrColr = new Float32Array([0.56, 0.78, 0.23]);	// dark gray
		 var topColr = new Float32Array([0.45, 0.66, 0.23]);	// light green
		 var botColr = new Float32Array([0.4, 0.34, 0.12]);	// light blue
		 var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
		 var botRadius = 1.6;		// radius of bottom of cylinder (top always 1.0)
		 
		 // Create a (global) array to hold this cylinder's vertices;
		 cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
												// # of vertices * # of elements needed to store them. 
		
			// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
			// v counts vertices: j counts array elements (vertices * elements per vertex)
			for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
				// skip the first vertex--not needed.
				if(v%2==0)
				{				// put even# vertices at center of cylinder's top cap:
					cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
					cylVerts[j+1] = 0.0;	
					cylVerts[j+2] = 1.0; 
					cylVerts[j+3] = 1.0;			// r,g,b = topColr[]
					cylVerts[j+4]=ctrColr[0]; 
					cylVerts[j+5]=ctrColr[1]; 
					cylVerts[j+6]=ctrColr[2];
				}
				else { 	// put odd# vertices around the top cap's outer edge;
								// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
								// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
					cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);			// x
					cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);			// y
					//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
					//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
					cylVerts[j+2] = 1.0;	// z
					cylVerts[j+3] = 1.0;	// w.
					// r,g,b = topColr[]
					cylVerts[j+4]=topColr[0]; 
					cylVerts[j+5]=topColr[1]; 
					cylVerts[j+6]=topColr[2];			
				}
			}
			// Create the cylinder side walls, made of 2*capVerts vertices.
			// v counts vertices within the wall; j continues to count array elements
			for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
				if(v%2==0)	// position all even# vertices along top cap:
				{		
						cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
						cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
						cylVerts[j+2] = 1.0;	// z
						cylVerts[j+3] = 1.0;	// w.
						// r,g,b = topColr[]
						cylVerts[j+4]=topColr[0]; 
						cylVerts[j+5]=topColr[1]; 
						cylVerts[j+6]=topColr[2];			
				}
				else		// position all odd# vertices along the bottom cap:
				{
						cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
						cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
						cylVerts[j+2] =-1.0;	// z
						cylVerts[j+3] = 1.0;	// w.
						// r,g,b = topColr[]
						cylVerts[j+4]=botColr[0]; 
						cylVerts[j+5]=botColr[1]; 
						cylVerts[j+6]=botColr[2];			
				}
			}
			// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
			// v counts the vertices in the cap; j continues to count array elements
			for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
				if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
					cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
					cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
					cylVerts[j+2] =-1.0;	// z
					cylVerts[j+3] = 1.0;	// w.
					// r,g,b = topColr[]
					cylVerts[j+4]=botColr[0]; 
					cylVerts[j+5]=botColr[1]; 
					cylVerts[j+6]=botColr[2];		
				}
				else {				// position odd#'d vertices at center of the bottom cap:
					cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
					cylVerts[j+1] = 0.0;	
					cylVerts[j+2] =-1.0; 
					cylVerts[j+3] = 1.0;			// r,g,b = botColr[]
					cylVerts[j+4]=botColr[0]; 
					cylVerts[j+5]=botColr[1]; 
					cylVerts[j+6]=botColr[2];
				}
			}
	}
	function makeDrawingaxis() {
		axisVerts = new Float32Array([
			0.0,  0.0,  0.0, 1.0,		1.0,  0,  0,	// X axis line (origin: gray)
			5,  0.0,  0.0, 1.0,		1.0,  0.0,  0.0,
			
			0.0,  0.0,  0.0, 1.0,		0.0,  1.0,  0,	// X axis line (origin: gray)
			0.0,  5.0,  0.0, 1.0,		0.0,  1.0,  0.0,
			
			0.0,  0.0,  0.0, 1.0,		0.0,  0,  1.0,	// X axis line (origin: gray)
			0.0,  0.0,  5.0, 1.0,		0.0,  0.0,  1.0,// 						 (endpoint: red)
		])
	}
function makeTorus() {
//==============================================================================
// 		Create a torus centered at the origin that circles the z axis.  
// Terminology: imagine a torus as a flexible, cylinder-shaped bar or rod bent 
// into a circle around the z-axis. The bent bar's centerline forms a circle
// entirely in the z=0 plane, centered at the origin, with radius 'rbend'.  The 
// bent-bar circle begins at (rbend,0,0), increases in +y direction to circle  
// around the z-axis in counter-clockwise (CCW) direction, consistent with our
// right-handed coordinate system.
// 		This bent bar forms a torus because the bar itself has a circular cross-
// section with radius 'rbar' and angle 'phi'. We measure phi in CCW direction 
// around the bar's centerline, circling right-handed along the direction 
// forward from the bar's start at theta=0 towards its end at theta=2PI.
// 		THUS theta=0, phi=0 selects the torus surface point (rbend+rbar,0,0);
// a slight increase in phi moves that point in -z direction and a slight
// increase in theta moves that point in the +y direction.  
// To construct the torus, begin with the circle at the start of the bar:
//					xc = rbend + rbar*cos(phi); 
//					yc = 0; 
//					zc = -rbar*sin(phi);			(note negative sin(); right-handed phi)
// and then rotate this circle around the z-axis by angle theta:
//					x = xc*cos(theta) - yc*sin(theta) 	
//					y = xc*sin(theta) + yc*cos(theta)
//					z = zc
// Simplify: yc==0, so
//					x = (rbend + rbar*cos(phi))*cos(theta)
//					y = (rbend + rbar*cos(phi))*sin(theta) 
//					z = -rbar*sin(phi)
// To construct a torus from a single triangle-strip, make a 'stepped spiral' 
// along the length of the bent bar; successive rings of constant-theta, using 
// the same design used for cylinder walls in 'makeCyl()' and for 'slices' in 
// makeSphere().  Unlike the cylinder and sphere, we have no 'special case' 
// for the first and last of these bar-encircling rings.
//
var rbend = 1.0;										// Radius of circle formed by torus' bent bar
var rbar = 0.5;											// radius of the bar we bent to form torus
var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
																		// more segments for more-circular torus
var barSides = 13;										// # of sides of the bar (and thus the 
																		// number of vertices in its cross-section)
																		// >=3 req'd;
																		// more sides for more-circular cross-section
// for nice-looking torus with approx square facets, 
//			--choose odd or prime#  for barSides, and
//			--choose pdd or prime# for barSlices of approx. barSides *(rbend/rbar)
// EXAMPLE: rbend = 1, rbar = 0.5, barSlices =23, barSides = 11.

	// Create a (global) array to hold this torus's vertices:
 torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
//	Each slice requires 2*barSides vertices, but 1st slice will skip its first 
// triangle and last slice will skip its last triangle. To 'close' the torus,
// repeat the first 2 vertices at the end of the triangle-strip.  Assume 7

var phi=0, theta=0;										// begin torus at angles 0,0
var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
																			// (WHY HALF? 2 vertices per step in phi)
	// s counts slices of the bar; v counts vertices within one slice; j counts
	// array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
	for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
		for(v=0; v< 2*barSides; v++, j+=7) {		// for each vertex in this slice:
			if(v%2==0)	{	// even #'d vertices at bottom of slice,
				torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * 
																						 Math.cos((s)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																						 Math.sin((s)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta) 
				torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			else {				// odd #'d vertices at top of slice (s+1);
										// at same phi used at bottom of slice (v-1)
				torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * 
																						 Math.cos((s+1)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																						 Math.sin((s+1)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta) 
				torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
		}
	}
	// Repeat the 1st 2 vertices of the triangle strip to complete the torus:
			torVerts[j  ] = rbend + rbar;	// copy vertex zero;
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
			torVerts[j+1] = 0.0;
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
			j+=7; // go to next vertex:
			torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
			torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
}
function makeTorus() {
	//==============================================================================
	// 		Create a torus centered at the origin that circles the z axis.  
	// Terminology: imagine a torus as a flexible, cylinder-shaped bar or rod bent 
	// into a circle around the z-axis. The bent bar's centerline forms a circle
	// entirely in the z=0 plane, centered at the origin, with radius 'rbend'.  The 
	// bent-bar circle begins at (rbend,0,0), increases in +y direction to circle  
	// around the z-axis in counter-clockwise (CCW) direction, consistent with our
	// right-handed coordinate system.
	// 		This bent bar forms a torus because the bar itself has a circular cross-
	// section with radius 'rbar' and angle 'phi'. We measure phi in CCW direction 
	// around the bar's centerline, circling right-handed along the direction 
	// forward from the bar's start at theta=0 towards its end at theta=2PI.
	// 		THUS theta=0, phi=0 selects the torus surface point (rbend+rbar,0,0);
	// a slight increase in phi moves that point in -z direction and a slight
	// increase in theta moves that point in the +y direction.  
	// To construct the torus, begin with the circle at the start of the bar:
	//					xc = rbend + rbar*cos(phi); 
	//					yc = 0; 
	//					zc = -rbar*sin(phi);			(note negative sin(); right-handed phi)
	// and then rotate this circle around the z-axis by angle theta:
	//					x = xc*cos(theta) - yc*sin(theta) 	
	//					y = xc*sin(theta) + yc*cos(theta)
	//					z = zc
	// Simplify: yc==0, so
	//					x = (rbend + rbar*cos(phi))*cos(theta)
	//					y = (rbend + rbar*cos(phi))*sin(theta) 
	//					z = -rbar*sin(phi)
	// To construct a torus from a single triangle-strip, make a 'stepped spiral' 
	// along the length of the bent bar; successive rings of constant-theta, using 
	// the same design used for cylinder walls in 'makeCyl()' and for 'slices' in 
	// makeSphere().  Unlike the cylinder and sphere, we have no 'special case' 
	// for the first and last of these bar-encircling rings.
	//
	var rbend = 1.0;										// Radius of circle formed by torus' bent bar
	var rbar = 0.5;											// radius of the bar we bent to form torus
	var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
																			// more segments for more-circular torus
	var barSides = 13;										// # of sides of the bar (and thus the 
																			// number of vertices in its cross-section)
																			// >=3 req'd;
																			// more sides for more-circular cross-section
	// for nice-looking torus with approx square facets, 
	//			--choose odd or prime#  for barSides, and
	//			--choose pdd or prime# for barSlices of approx. barSides *(rbend/rbar)
	// EXAMPLE: rbend = 1, rbar = 0.5, barSlices =23, barSides = 11.
	
		// Create a (global) array to hold this torus's vertices:
	 torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
	//	Each slice requires 2*barSides vertices, but 1st slice will skip its first 
	// triangle and last slice will skip its last triangle. To 'close' the torus,
	// repeat the first 2 vertices at the end of the triangle-strip.  Assume 7
	
	var phi=0, theta=0;										// begin torus at angles 0,0
	var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
	var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
																				// (WHY HALF? 2 vertices per step in phi)
		// s counts slices of the bar; v counts vertices within one slice; j counts
		// array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
		for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
			for(v=0; v< 2*barSides; v++, j+=7) {		// for each vertex in this slice:
				if(v%2==0)	{	// even #'d vertices at bottom of slice,
					torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * 
																							 Math.cos((s)*thetaStep);
								  //	x = (rbend + rbar*cos(phi)) * cos(theta)
					torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																							 Math.sin((s)*thetaStep);
									//  y = (rbend + rbar*cos(phi)) * sin(theta) 
					torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
									//  z = -rbar  *   sin(phi)
					torVerts[j+3] = 1.0;		// w
				}
				else {				// odd #'d vertices at top of slice (s+1);
											// at same phi used at bottom of slice (v-1)
					torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * 
																							 Math.cos((s+1)*thetaStep);
								  //	x = (rbend + rbar*cos(phi)) * cos(theta)
					torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																							 Math.sin((s+1)*thetaStep);
									//  y = (rbend + rbar*cos(phi)) * sin(theta) 
					torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
									//  z = -rbar  *   sin(phi)
					torVerts[j+3] = 1.0;		// w
				}
				torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
				torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
				torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
			}
		}
		// Repeat the 1st 2 vertices of the triangle strip to complete the torus:
				torVerts[j  ] = rbend + rbar;	// copy vertex zero;
							  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
				torVerts[j+1] = 0.0;
								//  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
				torVerts[j+2] = 0.0;
								//  z = -rbar  *   sin(phi==0)
				torVerts[j+3] = 1.0;		// w
				torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
				torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
				torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
				j+=7; // go to next vertex:
				torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
							  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
				torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
								//  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
				torVerts[j+2] = 0.0;
								//  z = -rbar  *   sin(phi==0)
				torVerts[j+3] = 1.0;		// w
				torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
				torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
				torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
	}
function initVertexBuffer() {
//==============================================================================
// NOTE!  'gl' is now a global variable -- no longer needed as fcn argument!

	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);	
	makeGroundGrid();
	makeCylinder();	
	makeSphere();	
	makeDrawingaxis();	
	makeTorus();		 

  var ProjA = new Float32Array([
  // Vertex coordinates(x,y,z,w) and color (R,G,B) for a color tetrahedron:
	//		Apex on +z axis; equilateral triangle base at z=0
/*	Nodes:
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 (apex, +z axis;  white)
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 (base: lower rt; red)
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2 (base: +y axis;  grn)
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3 (base:lower lft; blue)

*/
			// Face 0: (left side)  
     0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
			// Face 1: (right side)
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
    	// Face 2: (lower side)
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 
     	// Face 3: (base side)  
    -c30, -0.5,  0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     0.0,  1.0,  0.0, 1.0,  	1.0,  0.0,  0.0,	// Node 2
     c30, -0.5,  0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1

	 												// Part 1
	 0.7,  0.3,  0.0, 1.0, 		0.0,  0.0,  0.0, 	// Node 3
	 0.7,  0.0,  0.0, 1.0,  	0.5,  0.3,  0.0,	// Node 2
	 0.0,  0.0,  0.9, 1.0, 		0.0,  0.2,  0.2, 	// Node 1

	 												// Part 2 
													 //snowman 24v bot
	 0,     0,   0.5, 1.0,  	1.0, 0.0, 0.0,
	 0,     0,   0,   1.0,      0.0, 1.0, 0.0,
	 0.5,   0,   0.25,1.0,      1.0, 0.0, 1.0,
												 
	 0.5,   0,     0,  1.0,     1.0, 0.0, 0.0,
	 0,     0,     0,  1.0,     0.0, 1.0, 0.0,
	 0.5,   0,   0.25,1.0,      1.0, 1.0, 0.0,
												 
	 0.5,   0,     0,   1.0,    0.0, 0.0, 1.0,
	 0,     0,     0,     1.0,  0.0, 0.5, 1.0,
	 0.5,   0,     -0.25,1.0,   0.3, 0.4, 1.0,
												 
	 0,     0,     -0.5,  1.0,  0.3, 0.4, 0.6,
	 0,     0,     0,     1.0,  0.4, 0.7, 0.2,
	 0.5,   0,     -0.25,1.0,   0.0, 0.0, 0.0,
												 
	 0,     0,     -0.5,  1.0,  0.2, 0.6, 0.3,
	 0,     0,     0,      1.0, 0.5, 0.8, 0.4,
	 -0.5,  0,     -0.25,1.0,   0.2, 0.6, 0.9,
												 
	 -0.5,  0,     0,   1.0,   0.45, 0.78, 0.2,
	 0,     0,     0,     1.0, 0.8, 0.6, 0.4,
	 -0.5,  0,     -0.25,1.0,  0.2, 0.2, 0.4,
												 
	 -0.5,  0,     0,  1.0,    0.5, 0.4, 0.2,
	 0,     0,     0,   1.0,   0.1, 0.5, 0.7,
	 -0.5,  0,   0.25,1.0,     0.7, 0.7, 0.3,
												 
	 0,     0,   0.5,   1.0,   0.4, 0.4, 0.5,
	 0,     0,   0,    1.0,    0.4, 0.6, 0.1,
	 -0.5,  0,   0.25,1.0,     0.2, 0.7, 0.6,
												
	 											//snowman top 24v
	 0,     0,   0.35, 1.0,  	1.0, 0.0, 0.0,
	 0,     0,   0,   1.0,      0.0, 1.0, 0.0,
	 0.35,   0,   0.175,1.0,      1.0, 0.0, 1.0,
																							 
	0.35,   0,     0,  1.0,     1.0, 0.0, 0.0,
	0,     0,     0,  1.0,     0.0, 1.0, 0.0,
	0.35,   0,   0.175,1.0,      1.0, 1.0, 0.0,
																							 
	0.35,   0,     0,   1.0,    0.0, 0.0, 1.0,
	0,     0,     0,     1.0,  0.0, 0.5, 1.0,
	0.35,   0,     -0.175,1.0,   0.3, 0.4, 1.0,
																							 
	0,     0,     -0.35,  1.0,  0.3, 0.4, 0.6,
    0,     0,     0,     1.0,  0.4, 0.7, 0.2,
	0.35,   0,     -0.175,1.0,   0.0, 0.0, 0.0,
																							 
	0,     0,     -0.35,  1.0,  0.2, 0.6, 0.3,
	0,     0,     0,      1.0, 0.5, 0.8, 0.4,
	-0.35,  0,     -0.175,1.0,   0.2, 0.6, 0.9,
																							 
	-0.35,  0,     0,   1.0,   0.45, 0.78, 0.2,
	0,     0,     0,     1.0, 0.8, 0.6, 0.4,
	-0.35,  0,     -0.175,1.0,  0.2, 0.2, 0.4,
																							 
	-0.35,  0,     0,  1.0,    0.5, 0.4, 0.2,
	0,     0,     0,   1.0,   0.1, 0.5, 0.7,
	-0.35,  0,   0.175,1.0,     0.7, 0.7, 0.3,
																							 
	0,     0,   0.35,   1.0,   0.4, 0.4, 0.5,
	0,     0,   0,    1.0,    0.4, 0.6, 0.1,
	-0.35,  0,   0.175,1.0,     0.2, 0.7, 0.6,

											 //snowman side 1 6v
	0, 0, 0.5,   1.0,			0.0, 1.0, 0.0,
	0, 0.7, 0.35,  1.0,         1.0, 1.0, 0.0,
	0.5, 0, 0.25,1.0,			0.0, 1.0, 1.0,

	0.35, 0.7, 0.175,   1.0,	0.0, 1.0, 1.0,
	0, 0.7, 0.35,  1.0,          0.0, 1.0, 0.0,
	0.5, 0, 0.25,1.0,			0.0, 1.0, 0.0,

											 //snowman side 2 6v
	0.5, 0, 0.25,  1.0,			0.0, 0.0, 1.0,
	0.5, 0, -0.25,  1.0,        0.0, 1.0, 0.0,
	0.35, 0.7, 0.175,1.0,		0.0, 0.0, 0.0,

	0.35, 0.7, -0.175,   1.0,	1.0, 1.0, 1.0,
	0.5, 0, -0.25,  1.0,        0.0, 1.0, 0.0,
	0.35, 0.7, 0.175,1.0,		0.0, 0.0, 1.0,

												 //snowman side 3 6v
	0.35, 0.7, -0.175,   1.0,	1.0, 1.0, 1.0,
	0.5, 0, -0.25,  1.0,        0.0, 1.0, 0.0,
	0.0, 0.0, -0.5,1.0,		    0.0, 0.0, 0.0,

	0.35, 0.7, -0.175,   1.0,	1.0, 1.0, 1.0,
	0.0, 0.7, -0.35,  1.0,      0.0, 1.0, 0.0,
	0.0, 0.0, -0.5,1.0,		    0.0, 0.0, 0.0,

	
												 //snowman side 4 6v
	-0.35, 0.7, -0.175,   1.0,	1.0, 0.0, 1.0,
	-0.5, 0, -0.25,  1.0,       0.0, 0.0, 0.0,
	0.0, 0.0, -0.5,1.0,		    0.0, 0.0, 0.0,

	-0.35, 0.7, -0.175,   1.0,	1.0, 1.0, 1.0,
	0.0, 0.7, -0.35,  1.0,      0.0, 1.0, 0.0,
	0.0, 0.0, -0.5,1.0,		    0.0, 0.0, 0.0,

												 //snowman side 5 6v
	-0.5, 0, 0.25,  1.0,		0.0, 0.0, 1.0,
	-0.5, 0, -0.25,  1.0,       0.0, 1.0, 0.0,
	-0.35, 0.7, 0.175,1.0,		0.0, 0.0, 0.0,

	-0.35, 0.7, -0.175,   1.0,	1.0, 1.0, 1.0,
	-0.5, 0, -0.25,  1.0,        0.0, 1.0, 0.0,
	-0.35, 0.7, 0.175,1.0,		0.0, 0.0, 1.0,

	
												 //snowman side 6 6v
	0, 0, 0.5,   1.0,			0.0, 1.0, 0.0,
	0, 0.7, 0.35,  1.0,         1.0, 1.0, 0.0,
	-0.5, 0, 0.25,1.0,			0.0, 1.0, 1.0,

	-0.35, 0.7, 0.175,   1.0,	0.0, 1.0, 1.0,
	0, 0.7, 0.35,  1.0,          0.0, 1.0, 0.0,
	-0.5, 0, 0.25,1.0,			0.0, 1.0, 0.0,

													 //snowman head  24v
	0.0, 0.0, 0.3, 1.0,			1.0, 0.0, 0.0,
	0.5, 0.0, 0.0, 1.0,			0.0, 1.0, 0.0,
	0.0, 0.3, 0.0, 1.0,			0.0, 0.0, 1.0,

	0.0, 0.0, 0.3, 1.0,			1.0, 0.0, 0.0,
	0.5, 0.0, 0.0, 1.0,			0.0, 1.0, 0.0,
	0.0, -0.3, 0.0, 1.0,		0.0, 0.0, 1.0,

	0.0, 0.0, 0.3, 1.0,			1.0, 0.0, 0.0,
	-0.5, 0.0, 0.0, 1.0,		0.0, 1.0, 0.0,
	0.0, 0.3, 0.0, 1.0,			0.0, 0.0, 1.0,

	0.0, 0.0, 0.3, 1.0,			1.0, 0.0, 0.0,
	-0.5, 0.0, 0.0, 1.0,		0.0, 1.0, 0.0,
	0.0, -0.3, 0.0, 1.0,		0.0, 0.0, 1.0,

	0.0, 0.0, -0.3, 1.0,		1.0, 0.0, 0.0,
	0.5, 0.0, 0.0, 1.0,			0.0, 1.0, 0.0,
	0.0, 0.3, 0.0, 1.0,			1.0, 0.0, 1.0,

	0.0, 0.0, -0.3, 1.0,		1.0, 0.0, 0.0,
	0.5, 0.0, 0.0, 1.0,			0.0, 1.0, 0.0,
	0.0, -0.3, 0.0, 1.0,		1.0, 0.0, 1.0,

	0.0, 0.0, -0.3, 1.0,		1.0, 0.0, 0.0,
	-0.5, 0.0, 0.0, 1.0,		0.0, 1.0, 0.0,
	0.0, 0.3, 0.0, 1.0,			1.0, 0.0, 1.0,

	0.0, 0.0, -0.3, 1.0,		1.0, 0.0, 0.0,
	-0.5, 0.0, 0.0, 1.0,		0.0, 1.0, 0.0,
	0.0, -0.3, 0.0, 1.0,		0.0, 0.0, 1.0,
	//123 v

											   	//snowman arm 24
	0.0, 0.0, 0.0,	1.0,		1.0,0.0,0.0,
	0.0, 0.5, 0.0,  1.0, 		0.0,0.1,0.0,
	0.0, 0.0, 0.5, 1.0, 		0.0,0.0,1.0,

	0.0, 0.0, 0.0,	1.0,		1.0,0.0,0.0,
	0.0, -0.5, 0.0,  1.0, 		0.0,0.1,0.0,
	0.0, 0.0, 0.5, 1.0, 		0.0,0.0,1.0,

	0.0, 0.0, 0.0,	1.0,		1.0,0.0,0.0,
	0.0, 0.5, 0.0,  1.0, 		0.0,0.1,0.0,
	0.0, 0.0, -0.5, 1.0, 		0.0,0.0,1.0,

	0.0, 0.0, 0.0,	1.0,		1.0,0.0,0.0,
	0.0, -0.5, 0.0,  1.0, 		0.0,0.1,0.0,
	0.0, 0.0, -0.5, 1.0, 		0.0,0.0,1.0,

	0.9, 0.0, 0.0,	1.0,		1.0,0.0,0.0,
	0.0, 0.5, 0.0,  1.0, 		0.0,0.1,0.0,
	0.0, 0.0, 0.5, 1.0, 		0.0,0.0,1.0,

	0.9, 0.0, 0.0,	1.0,		1.0,0.0,0.0,
	0.0, -0.5, 0.0,  1.0, 		0.0,0.1,0.0,
	0.0, 0.0, 0.5, 1.0, 		0.0,0.0,1.0,

	0.9, 0.0, 0.0,	1.0,		1.0,0.0,0.0,
	0.0, 0.5, 0.0,  1.0, 		0.0,0.1,0.0,
	0.0, 0.0, -0.5, 1.0, 		0.0,0.0,1.0,

	0.9, 0.0, 0.0,	1.0,		1.0,0.0,0.0,
	0.0, -0.5, 0.0,  1.0, 		0.0,0.1,0.0,
	0.0, 0.0, -0.5, 1.0, 		0.0,0.0,1.0,
											 
											//snowman leg1 36v
	
	0.0, 0.0, 0.2,	1.0,		0.0,0.0,0.0,
	-0.2, 0.0, 0.0, 1.0, 		0.0,1.0,0.0,
	0.0, 0.0, -0.2, 1.0, 		0.0,0.0,0.1,

	0.0, 0.0, 0.2,	1.0,		0.0,0.0,0.0,
	0.2, 0.0, 0.0, 1.0, 		0.0,1.0,0.0,
	0.0, 0.0, -0.2, 1.0, 		0.0,0.0,0.1,

	0.0, -0.4, 0.2,	1.0,		0.0,0.0,0.0,
	-0.2,-0.4, 0.0, 1.0, 		0.0,1.0,0.0,
	0.0, -0.4, -0.2, 1.0, 		0.0,0.0,0.1,

	0.0, -0.4, 0.2,	1.0,		0.0,0.0,0.0,
	0.2, -0.4, 0.0, 1.0, 		0.0,1.0,0.0,
	0.0, -0.4, -0.2, 1.0, 		0.0,0.0,0.1,

	0.0, -0.4, 0.2,	1.0,		0.45,0.0,0.34,  //leg side
	0.0,  0.0, 0.2, 1.0, 		0.1,0.33,0.44,
	0.2, -0.4, 0.0, 1.0, 		0.78,0.56,0.2,

	0.2,  0.0, 0.0,	1.0,		0.12,0.12,0.78,
	0.0,  0.0, 0.2, 1.0, 		0.78,0.65,0.33,
	0.2, -0.4, 0.0, 1.0, 		0.56,0.34,0.89,

	0.2,  0.0, 0.0,	1.0,		0.45,0.0,0.34,  //leg side
	0.2,  -0.4, 0.0, 1.0, 		0.1,0.33,0.44,
	0.0, -0.4, -0.2, 1.0, 		0.78,0.56,0.2,

	0.2,  0.0, 0.0,	1.0,		0.12,0.12,0.78, 
	0.0,  0.0, -0.2, 1.0, 		0.78,0.65,0.33,
	0.0, -0.4, -0.2, 1.0, 		0.56,0.34,0.89,
	
	0.0, -0.4, 0.2,	1.0,		0.22,0.67,0.12,  //leg side
	0.0,  0.0, 0.2, 1.0, 		0.89,0.65,0.22,
	-0.2, -0.4, 0.0, 1.0, 		0.77,0.34,0.67,

	-0.2,  0.0, 0.0,	1.0,	0.87,0.12,0.34,
	0.0,  0.0, 0.2, 1.0, 		0.56,0.99,0.34,
	-0.2, -0.4, 0.0, 1.0, 		0.56,0.12,0.44,

	-0.2,  0.0, 0.0,	1.0,	0.22,0.67,0.12,  //leg side
	-0.2,  -0.4, 0.0, 1.0, 		0.56,0.99,0.34,
	0.0, -0.4, -0.2, 1.0, 		0.78,0.56,0.2,

	-0.2,  0.0, 0.0,	1.0,	0.78,0.65,0.33,  
	0.0,  0.0, -0.2, 1.0, 		0.1,0.33,0.44,
	0.0, -0.4, -0.2, 1.0, 		0.56,0.34,0.89,

											// fish head
	0.0,  0.0, 0.0,	1.0,		1.0,0.0,0.0,  
	0.3,  0.3, 0.0, 1.0, 		0.0,1.0,0.0,
	0.3,  0.0, 0.2, 1.0, 		0.0,0.0,0.1,

	0.0,  0.0, 0.0,	1.0,		0.23,0.56,0.78,  
	0.3,  0.0, 0.2, 1.0, 		0.0,1.0,0.0,
	0.3,  -0.3, 0.0, 1.0, 		0.0,0.0,.01,

	0.0,  0.0, 0.0,	1.0,		1.0,0.0,0.0,  
	0.3,  0.3, 0.0, 1.0, 		0.0,1.0,0.0,
	0.3,  0.0, -0.2, 1.0, 		0.0,0.0,0.1,

	0.0,  0.0, 0.0,	1.0,		1.0,0.0,0.0,  
	0.3,  0.0, -0.2, 1.0, 		0.0,1.0,0.0,
	0.3,  -0.3, 0.0, 1.0, 		0.0,0.0,0.1,

	0.3,  0.0, 0.2, 1.0, 		0.34,0.77,0.76,
	0.3,  0.3, 0.0, 1.0, 		0.23,0.56,0.87,
	0.9,  0.0, 0.2, 1.0, 		0.19,0.23,0.55,

	0.3,  0.0, 0.2, 1.0, 		0.4,0.0,0.33,
	0.3,  -0.3, 0.0, 1.0, 		0.19,0.45,0.67,
	0.9,  0.0, 0.2, 1.0, 		0.57,0.23,0.56,

	0.3,  0.0, -0.2, 1.0, 		0.0,0.54,0.78,
	0.3,  0.3, 0.0, 1.0, 		0.24,0.34,0.67,
	0.9,  0.0, -0.2, 1.0, 		0.11,0.13,0.23,

	0.3,  0.0, -0.2, 1.0, 		0.45,0.0,0.56,
	0.3,  -0.3, 0.0, 1.0, 		0.32,0.55,0.76,
	0.9,  0.0, -0.2, 1.0, 		0.0,0.0,0.0,

	0.9,  0.0, -0.2, 1.0, 		0.0,0.0,0.1,
	0.9,  0.0,  0.2, 1.0, 		0.0,0.0,0.1,
	0.3,  0.3, 0.0, 1.0, 		0.0,1.0,0.0,

	0.9,  0.0, -0.2, 1.0, 		0.34,0.65,0.67,
	0.9,  0.0,  0.2, 1.0, 		0.66,0.23,0.99,
	0.3,  -0.3, 0.0, 1.0, 		0.22,0.67,0.45,

												//snowman head compliment

	0.5,  0.0,  0.0, 1.0,		0.34,0.65,0.67,
	0.0,  0.3,  0.0, 1.0,		0.66,0.23,0.99,
	0.25, 0.6,  -0.1, 1.0,		0.34,0.65,0.67,									  
  ]);	
  


console.log(axisVerts)
  colorShapes = new Float32Array(1512 + gndVerts.length + cylVerts.length + sphVerts.length + axisVerts.length + torVerts.length)
  colorShapes.set(ProjA,0);
  colorShapes.set(gndVerts,1512);
  gndStart = 1512;
  colorShapes.set(cylVerts,1512 + gndVerts.length)
  cylStart = 1512 + gndVerts.length;
  colorShapes.set(sphVerts,1512 + gndVerts.length + cylVerts.length)
  sphStart = 1512 + gndVerts.length + cylVerts.length;
  colorShapes.set(axisVerts,1512 + gndVerts.length + cylVerts.length + sphVerts.length);
  axisStart = 1512 + gndVerts.length + cylVerts.length + sphVerts.length;
  colorShapes.set(torVerts, 1512 + gndVerts.length + cylVerts.length + sphVerts.length + axisVerts.length);
  torStart = 1512 + gndVerts.length + cylVerts.length + sphVerts.length + axisVerts.length;

  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

/* REMOVED -- global 'g_vertsMax' means we don't need it anymore
  return nn;
*/
}
function DrawTetra() {
	gl.drawArrays(gl.TRIANGLES, 0, 12);
}
function DrawWedge() {
	gl.drawArrays(gl.TRIANGLES, 6,6);
}
function DrawPart1() {
	gl.drawArrays(gl.TRIANGLES, 12, 3);
}
function DrawPart2() {
	gl.drawArrays(gl.TRIANGLES, 15, 24);
}
function DrawsnowmanBo() {
	gl.drawArrays(gl.TRIANGLES, 39, 24);
}
function DrawsnowmanCB() {
	gl.drawArrays(gl.TRIANGLES, 63, 36);
}

function DrawsnowmanHead() {
	gl.drawArrays(gl.TRIANGLES, 99, 24);
}
function DrawsnowmanHead2() {
	//gl.drawArrays(gl.TRIANGLES, 111, 12);
}
function Drawsnowmanarm() {
	gl.drawArrays(gl.TRIANGLES, 123, 24);
}
function Drawsnowmanleg() {
	gl.drawArrays(gl.TRIANGLES, 147, 36);
}
function DrawFishhead() {
	gl.drawArrays(gl.TRIANGLES, 183, 30);
}
function Drawpad() {
	gl.drawArrays(gl.TRIANGLES, 123, 24);
}

function Drawheadcom() {
	gl.drawArrays(gl.TRIANGLES, 213, 3);
}

function DrawProjB() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, g_canvas.width / 2, g_canvas.height);
	g_modelMatrix.setPerspective(35, 1, 1, 100);
	g_modelMatrix.lookAt(eyex,eyey,eyez,lookatx,lookaty,lookatz,0,0,1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawAll();
	gl.viewport(g_canvas.width/2, 0, g_canvas.width/2, g_canvas.height);
	g_modelMatrix.setOrtho(-7.31592, 7.31592, -7.31592, 7.31592, 1, 100);
	g_modelMatrix.lookAt(eyex,eyey,eyez,lookatx,lookaty,lookatz,0,0,1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	drawAll();
}


function drawAll() {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  
  
// Great question from student:
// "?How can I get the screen-clearing color (or any of the many other state
//		variables of OpenGL)?  'glGet()' doesn't seem to work..."
// ANSWER: from WebGL specification page: 
//							https://www.khronos.org/registry/webgl/specs/1.0/
//	search for 'glGet()' (ctrl-f) yields:
//  OpenGL's 'glGet()' becomes WebGL's 'getParameter()'

	clrColr = new Float32Array(4);
	clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
	// console.log("clear value:", clrColr);




	 pushMatrix(g_modelMatrix);  // SAVE world drawing coords.
	 
	
	 gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
		axisStart/floatsPerVertex,	// start at this vertex number, and
		axisVerts.length/floatsPerVertex);	// draw this many vertices.


	 //---------Draw Ground Plane, without spinning.
	 // position it.
	 g_modelMatrix.translate( 0.4, -0.4, 0.0);	
	 g_modelMatrix.scale(0.1, 0.1, 0.1);				// shrink by 10X:
	 

	 // Drawing:
	 // Pass our current matrix to the vertex shaders:
	 gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);

   // Draw just the ground-plane's vertices
   gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
							 gndStart/floatsPerVertex,	// start at this vertex number, and
							 gndVerts.length/floatsPerVertex);	// draw this many vertices.
 	g_modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.

	 pushMatrix(g_modelMatrix);     // SAVE world coord system;
	 //-------Draw Spinning Cylinder:
 	g_modelMatrix.translate(1.2,0.0,0);  // 'set' means DISCARD old matrix,
						 // (drawing axes centered in CVV), and then make new
						 // drawing axes moved to the lower-left corner of CVV. 
 	g_modelMatrix.scale(0.1, 0.1, 0.1);

//	g_modelMatrix.translate(0, 0, g_shift01);
						 // if you DON'T scale, cyl goes outside the CVV; clipped!
  //  g_modelMatrix.rotate(currentAngle, 0, 1, 0);  // spin around y axis.
   // Drawing:
 // Pass our current matrix to the vertex shaders:
 gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
 // Draw the cylinder's vertices, and no other vertices:
 gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
							 cylStart/floatsPerVertex, // start at this vertex number, and
							 cylVerts.length/floatsPerVertex);	// draw this many vertices.
	g_modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.

	pushMatrix(g_modelMatrix);     // SAVE world coord system;
	 //-------Draw Spinning Cylinder:
 	g_modelMatrix.translate(1.2,0.0,0.1);  // 'set' means DISCARD old matrix,
						 // (drawing axes centered in CVV), and then make new
						 // drawing axes moved to the lower-left corner of CVV. 
 	g_modelMatrix.scale(0.09, 0.09, 0.09);
	
	
	
	 g_modelMatrix.rotate(g_angle02, 1, 1, 0);
	 g_modelMatrix.translate(0, 0, g_shift03);
	

	
						 // if you DON'T scale, cyl goes outside the CVV; clipped!
  //  g_modelMatrix.rotate(currentAngle, 0, 1, 0);  // spin around y axis.
   // Drawing:
 // Pass our current matrix to the vertex shaders:
 gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
 // Draw the cylinder's vertices, and no other vertices:
 gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
							 cylStart/floatsPerVertex, // start at this vertex number, and
							 cylVerts.length/floatsPerVertex);	// draw this many vertices.
	g_modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.

	pushMatrix(g_modelMatrix);     // SAVE world coord system;
	//-------Draw Spinning Cylinder:
	g_modelMatrix.translate(1.2,0.0,0.2);  // 'set' means DISCARD old matrix,
						// (drawing axes centered in CVV), and then make new
						// drawing axes moved to the lower-left corner of CVV. 
	g_modelMatrix.scale(0.08, 0.08, 0.08);

	g_modelMatrix.rotate(-g_angle02, 1, 1, 0);
	g_modelMatrix.translate(0, 0, g_shift03);
						// if you DON'T scale, cyl goes outside the CVV; clipped!
 //  g_modelMatrix.rotate(currentAngle, 0, 1, 0);  // spin around y axis.
  // Drawing:
// Pass our current matrix to the vertex shaders:
gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
// Draw the cylinder's vertices, and no other vertices:
gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
							cylStart/floatsPerVertex, // start at this vertex number, and
							cylVerts.length/floatsPerVertex);	// draw this many vertices.
   g_modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.

   pushMatrix(g_modelMatrix);     // SAVE world coord system;
   //-------Draw Spinning Cylinder:
   g_modelMatrix.translate(1.2,0.0,0.3);  // 'set' means DISCARD old matrix,
					   // (drawing axes centered in CVV), and then make new
					   // drawing axes moved to the lower-left corner of CVV. 
   g_modelMatrix.scale(0.07, 0.07, 0.07);
   g_modelMatrix.rotate(g_angle02, 1, 1, 0);
   g_modelMatrix.translate(0, 0, g_shift03);
					   // if you DON'T scale, cyl goes outside the CVV; clipped!
//  g_modelMatrix.rotate(currentAngle, 0, 1, 0);  // spin around y axis.
 // Drawing:
// Pass our current matrix to the vertex shaders:
gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
// Draw the cylinder's vertices, and no other vertices:
gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
						   cylStart/floatsPerVertex, // start at this vertex number, and
						   cylVerts.length/floatsPerVertex);	// draw this many vertices.
  g_modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.

  pushMatrix(g_modelMatrix);     // SAVE world coord system;
  //-------Draw Spinning Cylinder:
  g_modelMatrix.translate(1.2,0.0,0.4);  // 'set' means DISCARD old matrix,
					  // (drawing axes centered in CVV), and then make new
					  // drawing axes moved to the lower-left corner of CVV. 
  g_modelMatrix.scale(0.06, 0.06, 0.06);
  g_modelMatrix.rotate(-g_angle02, 1, 1, 0);
  g_modelMatrix.translate(0, 0, g_shift03);
					  // if you DON'T scale, cyl goes outside the CVV; clipped!
//  g_modelMatrix.rotate(currentAngle, 0, 1, 0);  // spin around y axis.
// Drawing:
// Pass our current matrix to the vertex shaders:
gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
// Draw the cylinder's vertices, and no other vertices:
gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
						  cylStart/floatsPerVertex, // start at this vertex number, and
						  cylVerts.length/floatsPerVertex);	// draw this many vertices.
 g_modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.

 pushMatrix(g_modelMatrix);  // SAVE world drawing coords.
 //--------Draw Spinning torus
   g_modelMatrix.translate(1.9, -2, -0.5);	// 'set' means DISCARD old matrix,
 
   g_modelMatrix.scale(0.2, 0.2, 0.2);
						   // Make it smaller:
	 // Drawing:		
	 // Pass our current matrix to the vertex shaders:
	 g_modelMatrix.rotate(g_angle04, 0, 0, 1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		   // Draw just the torus's vertices
   gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
							 torStart/floatsPerVertex,	// start at this vertex number, and
							 torVerts.length/floatsPerVertex);	// draw this many vertices.
	
	g_modelMatrix.translate(0,3,0);
	g_modelMatrix.rotate(g_angle04, 0, 0, 1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		   // Draw just the torus's vertices
   gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
							 torStart/floatsPerVertex,	// start at this vertex number, and
							 torVerts.length/floatsPerVertex);	// draw this many vertices.
		g_modelMatrix.translate(0,3,0);
		g_modelMatrix.rotate(g_angle04, 0, 0, 1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		   // Draw just the torus's vertices
   gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
							 torStart/floatsPerVertex,	// start at this vertex number, and
							 torVerts.length/floatsPerVertex);	// draw this many vertices.
							 	g_modelMatrix.translate(0,3,0);
								 g_modelMatrix.rotate(g_angle04, 0, 0, 1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		   // Draw just the torus's vertices
   gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
							 torStart/floatsPerVertex,	// start at this vertex number, and
							 torVerts.length/floatsPerVertex);	// draw this many vertices.
	g_modelMatrix.translate(0,2,0);
	g_modelMatrix.rotate(g_angle04, 0, 0, 1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		   // Draw just the torus's vertices
gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
							  sphStart/floatsPerVertex,	// start at this vertex number, and 
							  sphVerts.length/floatsPerVertex);	// draw this many vertices.

  g_modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.




  pushMatrix(g_modelMatrix);  // SAVE world drawing coords.
  //--------Draw Spinning Sphere
  g_modelMatrix.translate(-0.5,-1,0); // 'set' means DISCARD old matrix,
						  // (drawing axes centered in CVV), and then make new
						  // drawing axes moved to the lower-left corner of CVV.
						// to match WebGL display canvas.
  g_modelMatrix.scale(0.1, 0.1, 0.1);
						  // Make it smaller:
  //g_modelMatrix.rotate(currentAngle, 1, 1, 0);  // Spin on XY diagonal axis
	// Drawing:		
	// Pass our current matrix to the vertex shaders:
	quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion-->Matrix
	g_modelMatrix.concat(quatMatrix);	// apply that matrix.
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
		axisStart/floatsPerVertex,	// start at this vertex number, and
		axisVerts.length/floatsPerVertex);	// draw this many vertices.
		  // Draw just the sphere's vertices
  gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
							  sphStart/floatsPerVertex,	// start at this vertex number, and 
							  sphVerts.length/floatsPerVertex);	// draw this many vertices.

	g_modelMatrix.rotate(g_angle04, 1, 0, 0)
	g_modelMatrix.translate(0,0,2.0)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	
	gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
		sphStart/floatsPerVertex,	// start at this vertex number, and 
		sphVerts.length/floatsPerVertex);	//
	g_modelMatrix.rotate(g_angle04, 1, 0, 0)
	g_modelMatrix.translate(0,0,2.0)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
		sphStart/floatsPerVertex,	// start at this vertex number, and 
		sphVerts.length/floatsPerVertex);	//
	g_modelMatrix.rotate(g_angle04, 1, 0, 0)
	g_modelMatrix.translate(0,0,2.0)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
		axisStart/floatsPerVertex,	// start at this vertex number, and
		axisVerts.length/floatsPerVertex);	// draw this many vertices.
	gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
		sphStart/floatsPerVertex,	// start at this vertex number, and 
		sphVerts.length/floatsPerVertex);	//
  g_modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.









	 pushMatrix(g_modelMatrix);
	 
	 g_modelMatrix.translate(0,-0.5, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV. 
  //g_modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
  																				// to match WebGL display canvas.
  g_modelMatrix.scale(0.5, 0.5, 0.5);
  						// if you DON'T scale, tetra goes outside the CVV; clipped!
 g_modelMatrix.translate(g_shift01,0,0);
 // g_modelMatrix.rotate(g_angle01, 0, 1, 0);  // Make new drawing axes that
 // g_modelMatrix.rotate(g_angle02, 1, 0, 0); 
   // Make new drawing axes that
  
  // DRAW TETRA:  Use this matrix to transform & draw 
  //						the first set of vertices stored in our VBO:w
  		// Pass our current matrix to the vertex shaders:
  g_modelMatrix.translate(0,g_shift02,0);
  
  g_modelMatrix.rotate(90, 1, 0 ,0);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  		// Draw triangles: start at vertex 0 and draw 12 vertices
  
  DrawPart2();
  DrawsnowmanCB();

  pushMatrix(g_modelMatrix);

  g_modelMatrix.translate(0.0, 0.7, 0.0);
 
  //g_modelMatrix.scale(0.7,0.7,0.7);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  DrawsnowmanBo();
  

  g_modelMatrix.translate(0.0, 0.3, 0.0);
  g_modelMatrix.scale(1.5,1,1);

  g_modelMatrix.rotate(g_angle03, 0, 1, 0);
  g_modelMatrix.rotate(g_angle01, 1, 0, 0);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  DrawsnowmanHead();
  g_modelMatrix.translate(0.0, 0.5, 0.0);
  g_modelMatrix.scale(1,0.666666,0.66666666);

  g_modelMatrix.rotate(g_angle03, 0, 1, 0);
  g_modelMatrix.rotate(g_angle01, 1, 0, 0);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  DrawsnowmanHead();

  g_modelMatrix.translate(0.0, 0.5, 0.0);
  g_modelMatrix.scale(1,0.666666,0.66666666);

  g_modelMatrix.rotate(g_angle03, 0, 1, 0);
  g_modelMatrix.rotate(g_angle01, 1, 0, 0);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  DrawsnowmanHead();

  g_modelMatrix.translate(0.0, 0.5, 0.0);
  g_modelMatrix.scale(1,0.666666,0.66666666);

  g_modelMatrix.rotate(g_angle03, 0, 1, 0);
  g_modelMatrix.rotate(g_angle01, 1, 0, 0);
  gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  DrawsnowmanHead();

  g_modelMatrix = popMatrix();
  pushMatrix(g_modelMatrix);

 
 

 g_modelMatrix = popMatrix();
 g_modelMatrix = popMatrix();


  // NEXT, create different drawing axes, and...
  g_modelMatrix.translate(0.0, 0.9, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV.
 // g_modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
  																				// to match WebGL display canvas.
  g_modelMatrix.scale(0.8, 0.8, 0.8);				// Make it smaller.
  
  // Mouse-Dragging for Rotation:
	//-----------------------------
	// Attempt 1:  X-axis, then Y-axis rotation:
/*  						// First, rotate around x-axis by the amount of -y-axis dragging:
  g_modelMatrix.rotate(-g_yMdragTot*120.0, 1, 0, 0); // drag +/-1 to spin -/+120 deg.
  						// Then rotate around y-axis by the amount of x-axis dragging
	g_modelMatrix.rotate( g_xMdragTot*120.0, 0, 1, 0); // drag +/-1 to spin +/-120 deg.
				// Acts SENSIBLY if I always drag mouse to turn on Y axis, then X axis.
				// Acts WEIRDLY if I drag mouse to turn on X axis first, then Y axis.
				// ? Why is is 'backwards'? Duality again!
*/
	//-----------------------------

	// Attempt 2: perp-axis rotation:
							// rotate on axis perpendicular to the mouse-drag direction:

							// why add 0.001? avoids divide-by-zero in next statement
							// in cases where user didn't drag the mouse.)
	//g_modelMatrix.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);

	
	g_modelMatrix.translate(1, 1, 0.0);

	g_modelMatrix.rotate(g_angle01, 1, 1, 1); 
	g_modelMatrix.scale(0.65,0.65,0.65)
	pushMatrix(g_modelMatrix);
	g_modelMatrix.rotate(g_angle01, 1, 0, 0); 
  	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
  		// Draw only the last 2 triangles: start at vertex 6, draw 6 vertices
	//DrawWedge();
	
	DrawFishhead();
	g_modelMatrix.translate(0.9,0.0,0.0)
	g_modelMatrix.rotate(g_angle03, 1, 0, 1); 
	g_modelMatrix.scale(0.3,0.3,0.3)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	Drawpad();
	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
	g_modelMatrix.rotate(g_angle01, 0, 1, 0); 
	g_modelMatrix.rotate(90.0,0,0,1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawFishhead();
	g_modelMatrix.translate(0.9,0.0,0.0)
	g_modelMatrix.rotate(g_angle03, 1, 0, 1); 
	g_modelMatrix.scale(0.3,0.3,0.3)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	Drawpad();
	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
	g_modelMatrix.rotate(g_angle01, 1, 0, 0); 
	g_modelMatrix.rotate(180.0,0,0,1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawFishhead();
	g_modelMatrix.translate(0.9,0.0,0.0)
	g_modelMatrix.rotate(g_angle03, 1, 0, 1); 
	g_modelMatrix.scale(0.3,0.3,0.3)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	Drawpad();
	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
	g_modelMatrix.rotate(g_angle01, 0, 1, 0); 
	g_modelMatrix.rotate(270.0,0,0,1);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawFishhead();
	g_modelMatrix.translate(0.9,0.0,0.0)
	g_modelMatrix.rotate(g_angle03, 1, 0, 1); 
	g_modelMatrix.scale(0.3,0.3,0.3)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	Drawpad();
	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
	g_modelMatrix.rotate(g_angle01, 0, 0, 1); 
	g_modelMatrix.rotate(90.0,0,1,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawFishhead();
	g_modelMatrix.translate(0.9,0.0,0.0)
	g_modelMatrix.rotate(g_angle03, 1, 0, 1); 
	g_modelMatrix.scale(0.3,0.3,0.3)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	Drawpad();
	g_modelMatrix = popMatrix();
	pushMatrix(g_modelMatrix);
	g_modelMatrix.rotate(g_angle01, 0, 0, 1); 
	g_modelMatrix.rotate(-90.0,0,1,0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawFishhead();
	g_modelMatrix.translate(0.9,0.0,0.0)
	g_modelMatrix.rotate(g_angle03, 1, 0, 1); 
	g_modelMatrix.scale(0.3,0.3,0.3)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	Drawpad();
	
	
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate() {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +120 and -85 degrees:
//  if(angle >  120.0 && g_angle01Rate > 0) g_angle01Rate = -g_angle01Rate;
//  if(angle <  -85.0 && g_angle01Rate < 0) g_angle01Rate = -g_angle01Rate;
  
  g_angle01 = g_angle01 + (g_angle01Rate * elapsed) / 1000.0;
  if(g_angle01 >= 180.0) g_angle01 = g_angle01 - 360.0;
  if(g_angle01 <= -180.0) g_angle01 = g_angle01 + 360.0;

	g_angle02 = g_angle02 + (g_angle02Rate * elapsed) / 1000.0;
  if(g_angle02 > 180.0) g_angle02 = g_angle02 - 360.0;
  if(g_angle02 <-180.0) g_angle02 = g_angle02 + 360.0;
  
  if(g_angle02 > 10.0 && g_angle02Rate > 0) g_angle02Rate *= -1.0;
  if(g_angle02 < -10.0  && g_angle02Rate < 0) g_angle02Rate *= -1.0;

  g_angle03 = g_angle03 + (g_angle03Rate * elapsed) / 1000.0;
  if(g_angle03 > 180.0) g_angle03 = g_angle03 - 360.0;
  if(g_angle03 <-180.0) g_angle03 = g_angle03 + 360.0;

  g_shift01 = g_shift01 + (g_shift01Rate) / 100.0;
  if(g_shift01 > 0.6) g_shift01Rate *= -1.0;
  if(g_shift01 < -0.6) g_shift01Rate *= -1.0;

  g_shift03 = g_shift03 + (g_shift03Rate) / 100.0;
  if(g_shift03 > 0.6) g_shift03Rate *= -1.0;
  if(g_shift03 < -0.6) g_shift03Rate *= -1.0;


  g_angle04 = g_angle04 + (g_angle04Rate * elapsed) / 1000.0;
  if(g_angle04 > 180.0) g_angle04 = g_angle04 - 360.0;
  if(g_angle04 <-180.0) g_angle04 = g_angle04 + 360.0;
  
  if(g_angle04 > 45.0) g_angle04Rate *= -1.0;
  if(g_angle04 <-45.0) g_angle04Rate *= -1.0;

  g_angle05 = g_angle05 + (g_angle05Rate * elapsed) / 1000.0;
  if(g_angle05 > 180.0) g_angle05 = g_angle05 - 360.0;
  if(g_angle05 <-180.0) g_angle05 = g_angle05 + 360.0;
  
  if(g_angle05 < -45.0) g_angle05Rate *= -1.0;
  if(g_angle05 > 45.0) g_angle05Rate *= -1.0;

  g_angle06 = g_angle06 + (g_angle06Rate * elapsed) / 1000.0;
  if(g_angle06 >= 180.0) g_angle06 = g_angle06 - 360.0;
  if(g_angle06 <= -180.0) g_angle06 = g_angle06 + 360.0;
  
  if(g_angle06 > 45.0) g_angle06Rate *= -1.0;
  if(g_angle06 <-45.0) g_angle06Rate *= -1.0;

  g_angle07 = g_angle07 + (g_angle07Rate * elapsed) / 1000.0;
  if(g_angle07 >= 180.0) g_angle07 = g_angle07 - 360.0;
  if(g_angle07 <= -180.0) g_angle07 = g_angle07 + 360.0;
  
  if(g_angle07 < -45.0) g_angle07Rate *= -1.0;
  if(g_angle07 > 45.0) g_angle07Rate *= -1.0;
	//console.log(g_angle05Rate);

	g_angle08 = g_angle08 + (g_angle08Rate * elapsed) / 1000.0;
	if(g_angle08 >= 180.0) g_angle08 = g_angle08 - 360.0;
	if(g_angle08 <= -180.0) g_angle08 = g_angle08 + 360.0;
	
	if(g_angle08 < -60.0) g_angle08Rate *= -1.0;
	if(g_angle08 > 60.0) g_angle08Rate *= -1.0;

	  g_angle09 = g_angle07 + (g_angle09Rate * elapsed) / 1000.0;
	  if(g_angle09 >= 180.0) g_angle09 = g_angle09 - 360.0;
	  if(g_angle09 <= -180.0) g_angle09 = g_angle09 + 360.0;
	  
	  if(g_angle09 < -60.0) g_angle09Rate *= -1.0;
	  if(g_angle09 > 60.0) g_angle09Rate *= -1.0;
	



}
//==================HTML Button Callbacks======================

function angleSubmit() {
// Called when user presses 'Submit' button on our webpage
//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
//	the HTML 'input' element with id='usrAngle'.  Within that
//	element you'll find a 'button' element that calls this fcn.

// Read HTML edit-box contents:
	var UsrTxt = document.getElementById('usrAngle').value;	
// Display what we read from the edit-box: use it to fill up
// the HTML 'div' element with id='editBoxOut':
  document.getElementById('EditBoxOut').innerHTML ='You Typed: '+UsrTxt;
 // console.log('angleSubmit: UsrTxt:', UsrTxt); // print in console, and
  g_angle01 = parseFloat(UsrTxt);     // convert string to float number 
};

function clearDrag() {
// Called when user presses 'Clear' button in our webpage
	g_xMdragTot = 0.0;
	g_yMdragTot = 0.0;
}

function spinUp() {
// Called when user presses the 'Spin >>' button on our webpage.
// ?HOW? Look in the HTML file (e.g. ControlMulti.html) to find
// the HTML 'button' element with onclick='spinUp()'.
  g_angle01Rate += 35; 
}

function spinDown() {
// Called when user presses the 'Spin <<' button
 g_angle01Rate -= 35; 
}

function runStop() {
// Called when user presses the 'Run/Stop' button
  if(g_angle01Rate*g_angle01Rate > 1) {  // if nonzero rate,
    myTmp = g_angle01Rate;  // store the current rate,
    g_angle01Rate = 0;      // and set to zero.
  }
  else {    // but if rate is zero,
  	g_angle01Rate = myTmp;  // use the stored rate.
  }

  
}

//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	g_isDrag = true;											// set our mouse-dragging flag
	g_xMclik = x;													// record where mouse-dragging began
	g_yMclik = y;
	// report on webpage
//	document.getElementById('MouseAtResult').innerHTML = 
	//  'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
};


function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);		// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//									-1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	g_xMdragTot += (x - g_xMclik);			// Accumulate change-in-mouse-position,&
	g_yMdragTot += (y - g_yMclik);

	dragQuat(x - g_xMclik, y - g_yMclik);
	// Report new mouse position & how far we moved on webpage:
//	document.getElementById('MouseAtResult').innerHTML = 
	//  'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
//	document.getElementById('MouseDragResult').innerHTML = 
	//  'Mouse Drag: '+(x - g_xMclik).toFixed(g_digits)+', ' 
	  		//			  +(y - g_yMclik).toFixed(g_digits);

	g_xMclik = x;											// Make next drag-measurement from here.
	g_yMclik = y;
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords):\n\t xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseUp  (CVV coords  ):\n\t x, y=\t',x,',\t',y);
	
	g_isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	g_xMdragTot += (x - g_xMclik);
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position:
//	document.getElementById('MouseAtResult').innerHTML = 
	  //'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
//	console.log('myMouseUp: g_xMdragTot,g_yMdragTot =',
	//	g_xMdragTot.toFixed(g_digits),',\t',g_yMdragTot.toFixed(g_digits));
};

function myMouseClick(ev) {
//=============================================================================
// Called when user completes a mouse-button single-click event 
// (e.g. mouse-button pressed down, then released)
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
//	console.log("myMouseClick() on button: ", ev.button); 
}	

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event 
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
//	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	

function myKeyDown(kev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 2/2019:  use kev.key and kev.code instead.
//
// Report EVERYTHING in console:
 // console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
            //  "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
           //   "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);
	rad2 = Math.sqrt((lookatx - eyex) * (lookatx - eyex) + (lookaty - eyey) * (lookaty - eyey));

	switch(kev.code) {
		case "KeyP":
			//console.log("Pause/unPause!\n");                // print on console,
			//document.getElementById('KeyDownResult').innerHTML =  
			//'myKeyDown() found p/P key. Pause/unPause!';   // print on webpage
			if(g_angle01Rate*g_angle01Rate > 1) {  // if nonzero rate,
				myTmp = g_angle01Rate;  // store the current rate,
				g_angle01Rate = 0;      // and set to zero.
			  }
			  else {    // but if rate is zero,
				  g_angle01Rate = myTmp;  // use the stored rate.
			  }
			break;
		//------------------WASD navigation-----------------
		case "KeyA":
		//	console.log("a/A key: Strafe LEFT!\n");
			//document.getElementById('KeyDownResult').innerHTML =  
		//	'myKeyDown() found a/A key. Run/Stop';
			theta += 0.01;
			lookatx = eyex + rad2 * Math.cos(theta)
			lookaty = eyey + rad2 * Math.sin(theta)
			console.log(eyex, eyey, eyez, lookatx, lookaty, lookatz)
			break;
    case "KeyD":
			
			//document.getElementById('KeyDownResult').innerHTML = 
			//'myKeyDown() found d/D key. Strafe RIGHT!';
			theta -= 0.01;
			lookatx = eyex + rad2 * Math.cos(theta)
			lookaty = eyey + rad2 * Math.sin(theta)
			console.log(eyex, eyey, eyez, lookatx, lookaty, lookatz)
			break;a
		case "KeyS":
		//	console.log("s/S key: Move BACK!\n");
		//	document.getElementById('KeyDownResult').innerHTML = 
			//myKeyDown() found s/Sa key. Move Down.';
			lookatz -= 0.03;
			console.log(eyex, eyey, eyez, lookatx, lookaty, lookatz)
			break;
		case "KeyW":
			//console.log("w/W key: Move FWD!\n");
		//	document.getElementById('KeyDownResult').innerHTML =  
		//	'myKeyDown() found w/W key. Move Up.';
			lookatz += 0.03;
			console.log(eyex, eyey, eyez, lookatx, lookaty, lookatz)
			break;
		//----------------Arrow keys------------------------
		case "ArrowLeft": 	
			
			// and print on webpage in the <div> element with id='Result':
  	//	document.getElementById('KeyDownResult').innerHTML =
  			//'myKeyDown(): Left Arrow='+kev.keyCode;
			  eyex -= 0.04 * Math.sin(theta);
			  eyey += 0.04 * Math.cos(theta);
			  //eyez += 0.07 * (lookatz - eyez);
			  lookatx -= 0.04 * Math.sin(theta);
			  lookaty += 0.04 *  Math.cos(theta);
			  //lookatz += 0.07 * (lookatz - eyez);
			  console.log(eyex, eyey, eyez, lookatx, lookaty, lookatz)
			break;
		case "ArrowRight":
		
  //		document.getElementById('KeyDownResult').innerHTML =
  		//	'myKeyDown():Right Arrow:keyCode='+kev.keyCode;
			  eyex += 0.04 * Math.sin(theta);
			  eyey -= 0.04 * Math.cos(theta);
			  //eyez += 0.07 * (lookatz - eyez);
			  lookatx += 0.04 * Math.sin(theta);
			  lookaty -= 0.04 *  Math.cos(theta);
			  console.log(eyex, eyey, eyez, lookatx, lookaty, lookatz)
  		break;
		case "ArrowUp":		
		
  	//	document.getElementById('KeyDownResult').innerHTML =
  		//	'myKeyDown():   Up Arrow: Move Up.';
			eyex += 0.07 * (lookatx - eyex);
			eyey += 0.07 * (lookaty - eyey);
			eyez += 0.07 * (lookatz - eyez);
			lookatx += 0.07 * (lookatx - eyex);
			lookaty += 0.07 * (lookaty - eyey);
			lookatz += 0.07 * (lookatz - eyez);
			console.log(eyex, eyey, eyez, lookatx, lookaty, lookatz)
			break;
		case "ArrowDown":
		
  	//	document.getElementById('KeyDownResult').innerHTML =
  		//	'myKeyDown(): Down Arrow: Move Down.';
			  eyex -= 0.07 * (lookatx - eyex);
			  eyey -= 0.07 * (lookaty - eyey);
			  eyez -= 0.07 * (lookatz - eyez);
			  lookatx -= 0.07 * (lookatx - eyex);
			  lookaty -= 0.07 * (lookaty - eyey);
			  lookatz -= 0.07 * (lookatz - eyez);
			  console.log(eyex, eyey, eyez, lookatx, lookaty, lookatz)
  		break;	
    default:
    //  console.log("UNUSED!");
  	//	document.getElementById('KeyDownResult').innerHTML =
  		//	'myKeyDown(): UNUSED!';
      break;
	}
}

function myKeyUp(kev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well

	console.log('myKeyUp()--keyCode='+kev.keyCode+' released.');
}
function dragQuat(xdrag, ydrag) {
	//==============================================================================
	// Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
	// We find a rotation axis perpendicular to the drag direction, and convert the 
	// drag distance to an angular rotation amount, and use both to set the value of 
	// the quaternion qNew.  We then combine this new rotation with the current 
	// rotation stored in quaternion 'qTot' by quaternion multiply.  Note the 
	// 'draw()' function converts this current 'qTot' quaternion to a rotation 
	// matrix for drawing. 
		var res = 5;
		var qTmp = new Quaternion(0,0,0,1);
		
		var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
		// console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
		qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist*150.0);
		// (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
								// why axis (x,y,z) = (-yMdrag,+xMdrag,0)? 
								// -- to rotate around +x axis, drag mouse in -y direction.
								// -- to rotate around +y axis, drag mouse in +x direction.
								
		qTmp.multiply(qNew,qTot);			// apply new rotation to current rotation. 
		//--------------------------
		// IMPORTANT! Why qNew*qTot instead of qTot*qNew? (Try it!)
		// ANSWER: Because 'duality' governs ALL transformations, not just matrices. 
		// If we multiplied in (qTot*qNew) order, we would rotate the drawing axes
		// first by qTot, and then by qNew--we would apply mouse-dragging rotations
		// to already-rotated drawing axes.  Instead, we wish to apply the mouse-drag
		// rotations FIRST, before we apply rotations from all the previous dragging.
		//------------------------
		// IMPORTANT!  Both qTot and qNew are unit-length quaternions, but we store 
		// them with finite precision. While the product of two (EXACTLY) unit-length
		// quaternions will always be another unit-length quaternion, the qTmp length
		// may drift away from 1.0 if we repeat this quaternion multiply many times.
		// A non-unit-length quaternion won't work with our quaternion-to-matrix fcn.
		// Matrix4.prototype.setFromQuat().
	//	qTmp.normalize();						// normalize to ensure we stay at length==1.0.
		qTot.copy(qTmp);
		// show the new quaternion qTot on our webpage in the <div> element 'QuatValue'
	//	document.getElementById('QuatValue').innerHTML= 
														//	 '\t X=' +qTot.x.toFixed(res)+
														//	'i\t Y=' +qTot.y.toFixed(res)+
														//	'j\t Z=' +qTot.z.toFixed(res)+
														//	'k\t W=' +qTot.w.toFixed(res)+
														//	'<br>length='+qTot.length().toFixed(res);
	};
	
	function drawResize() {
		//==============================================================================
		// Called when user re-sizes their browser window , because our HTML file
		// contains:  <body onload="main()" onresize="winResize()">
		
			//Report our current browser-window contents:
		
			console.log('g_Canvas width,height=', g_canvas.width, g_canvas.height);		
		 console.log('Browser window: innerWidth,innerHeight=', 
																		innerWidth, innerHeight);	
																		// http://www.w3schools.com/jsref/obj_window.asp
		
			
			//Make canvas fill the top 3/4 of our browser window:
			var xtraMargin = 40;    // keep a margin (otherwise, browser adds scroll-bars)
			g_canvas.width = window.innerWidth - xtraMargin;
			g_canvas.height = (window.innerHeight  *3/4) - xtraMargin;
			// IMPORTANT!  Need a fresh drawing in the re-sized viewports.
		//	draw();				// draw in all viewports.
		}