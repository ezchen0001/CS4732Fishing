/*
    CS 4732 - Project 1
    @author Ethan Chen
*/
let rodBaseAngle = 0; // GLOBAL variable to track base rod bend

function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}
let upperArm,forearm,hand
// Toggling functionality for interface
let usingCatmullRom = false

function activatecatmull(){
    usingCatmullRom = true
}

function activatebspline(){
    usingCatmullRom = false
}

// Data storage for constructing a colored cube
let pointsArray = [];
let colorsArray = [];

let vertices = [
    vec4( -0.5, -0.5,  0.5, 0.5 ),
    vec4( -0.5,  0.5,  0.5, 0.5 ),
    vec4( 0.5,  0.5,  0.5, 0.5 ),
    vec4( 0.5, -0.5,  0.5, 0.5 ),
    vec4( -0.5, -0.5, -0.5, 0.5 ),
    vec4( -0.5,  0.5, -0.5, 0.5 ),
    vec4( 0.5,  0.5, -0.5, 0.5 ),
    vec4( 0.5, -0.5, -0.5, 0.5 )
];

let vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

function quad(a, b, c, d, color) {
     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[color]);

     pointsArray.push(vertices[b]);
     colorsArray.push(vertexColors[color]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[color]);

     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[color]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[color]);

     pointsArray.push(vertices[d]);
     colorsArray.push(vertexColors[color]);
}

// Fills pointsArray and colorArray with vertex position and color data
function colorCube()
{
    pointsArray.length = 0
    colorsArray.length = 0
    quad( 1, 0, 3, 2, 1);
    quad( 2, 3, 7, 6, 2);
    quad( 3, 0, 4, 7, 3);
    quad( 6, 5, 1, 2, 6);
    quad( 4, 5, 6, 7, 4);
    quad( 5, 4, 0, 1, 5);
}

// Applies matrix on current cube
function multCube(m){
    for (i = 0; i < pointsArray.length; i++){
        pointsArray[i] = mult(m, pointsArray[i])
    }
}

// Same thing but only one color instead
function singleColorCube(color){
    pointsArray.length = 0
    colorsArray.length = 0
    quad( 1, 0, 3, 2, color);
    quad( 2, 3, 7, 6, color);
    quad( 3, 0, 4, 7, color);
    quad( 6, 5, 1, 2, color);
    quad( 4, 5, 6, 7, color);
    quad( 5, 4, 0, 1, color);
}


// Container for model data
class Model {

    constructor(gl) {
        this.posBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();
        this.bufferLength = 0
        this.transform = mat4()
        this.parent = null
    }
    // Requires the gl context first
    // Each input afterwards is an array of vec4
    // The length of the points array is used as the length of the buffers
    setData(gl, points, colors){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        this.bufferLength = points.length;
    }

    // New parent must be a model or null
    setParent(newParent){
        this.parent = newParent
    }

    // Gets world transform, which includes parent transforms
    getWorldTransform(){
        if (this.parent != null){
            return mult(this.parent.getWorldTransform(), this.transform)
        }else{
            return this.transform
        }
    }

}

// Linearly interpolates between two quaternions
function slerp(q1, q2, t) {
	var theta = Math.asin(dot(q1,q2))
	return normalize(add(scale(Math.sin((1-t)*theta)/Math.sin(theta),q1), scale(Math.sin(t*theta)/Math.sin(theta), q2)));
}


// Finds a point on catmullrom curve given an array of vec4 points
// Returns vec4
// 'a' is wrapped around 0 to points.length, and loops from the end to the start point
function findCatmullRomPoint(points, a) {
	a *= points.length
    let t = a - Math.floor(a)
    let i = Math.floor(a)

	let u = vec4(Math.pow(t,3),Math.pow(t,2),Math.pow(t,1),1)
	let m = mat4(
		vec4(-1, 3, -3, 1),
		vec4(2, -5, 4, -1),
		vec4(-1, 0, 1, 0),
		vec4(0, 2, 0, 0)
	)
	for (let maj = 0 ; maj < m.length; maj++){
		let inner = m[maj]
		for (let mi = 0; mi < inner.length; mi++){
			inner[mi] *= 0.5
		}
	}
	let p0 = points[(i+points.length-1)%points.length]
	let p1 = points[(i+points.length)%points.length]
	let p2 = points[(i+points.length+1)%points.length]
	let p3 = points[(i+points.length+2)%points.length]
	let bx = vec4(p0[0], p1[0], p2[0], p3[0])
	let by = vec4(p0[1], p1[1], p2[1], p3[1])
	let bz = vec4(p0[2], p1[2], p2[2], p3[2])


	return [dot(u,mult(m,bx)), dot(u,mult(m,by)), dot(u,mult(m,bz)), 1];

}



// Finds a point on bspline curve given an array of vec4 points
// Returns vec4
// 'a' is wrapped around 0 to points.length, and loops from the end to the start point
function findBSplinePoint(points, a) {
	a *= points.length
    let t = a - Math.floor(a)
    let i = Math.floor(a)
    let u = vec4(Math.pow(t,3),Math.pow(t,2),Math.pow(t,1),1)
	let m = mat4(
		vec4(-1, 3, -3, 1),
		vec4(3, -6, 3, 0),
		vec4(-3, 0, 3, 0),
		vec4(1, 4, 1, 0)
	)

	let p0 = points[(i+points.length-1)%points.length]
	let p1 = points[(i+points.length)%points.length]
	let p2 = points[(i+points.length+1)%points.length]
	let p3 = points[(i+points.length+2)%points.length]
	let bx = vec4(p0[0], p1[0], p2[0], p3[0])
	let by = vec4(p0[1], p1[1], p2[1], p3[1])
	let bz = vec4(p0[2], p1[2], p2[2], p3[2])

	return [dot(u,mult(m,bx)) * 1/6, dot(u,mult(m,by)) * 1/6,  dot(u,mult(m,bz)) * 1/6, 1];
}


// Finds a slerp given an array of quaternions
// Returns slerped quaternion
// 'a' is wrapped around 0 to points.length, and loops from the end to the start point
function findQuatRotPoint(points, a){
    a *= points.length
    let t = a - Math.floor(a)
    let i = Math.floor(a)
	let q0 = points[(i+points.length)%points.length]
	let q1 = points[(i+points.length+1)%points.length]
    return slerp(q0, q1, t)
}

// Data structure for splines
class Spline {
    constructor(time, posPoints, rotPoints){
        this.time = time
        this.posPoints = posPoints
        this.rotPoints = rotPoints
    }
}

class Tween {
    // func is a function that takes a float
    // time is in seconds
    constructor(time, startValue, endValue, func){
        this.func = func
        this.elapsedTime = 0
        this.duration = time
        this.startValue = startValue
        this.endValue = endValue
    }
    update(dt){ // Lerp
        this.elapsedTime += dt
        let a = this.elapsedTime/this.duration
        this.func((1-a) * this.startValue + a*this.endValue)
    }
}

// --- Inserted FK/IK skeletal animation logic for arm casting ---
// Improved bone structure for upper arm and forearm
let bones = [
    { x: 0, y: 0, angle: 0, length: 1 }, // upper arm
    { x: 0, y: 0, angle: 0, length: 1 }  // forearm
];
let target = { x: 0.4, y: 1.0 }; // target that arm reaches towards

// Fixed IK function that properly calculates joint angles
function inverseKinematics(targetX, targetY) {
    L1 = bones[0].length;
    L2 = bones[1].length;

    // Calculate distance to target
    let distance = Math.sqrt(targetX * targetX + targetY * targetY);

    // Clamp distance to maximum reach
    distance = Math.min(distance, L1 + L2 - 0.01);

    // Calculate joint angles using law of cosines
    let cos_theta2 = (distance*distance - L1*L1 - L2*L2) / (2 * L1 * L2);
    // Clamp to valid range to avoid NaN
    cos_theta2 = Math.max(-1, Math.min(1, cos_theta2));

    // Calculate theta2 - angle of the elbow
    theta2 = Math.acos(cos_theta2);

    // Calculate theta1 - angle of the shoulder
    let targetAngle = Math.atan2(targetY, targetX);
    let phi = Math.atan2(L2 * Math.sin(theta2), L1 + L2 * Math.cos(theta2));
    theta1 = targetAngle - phi;
}

// Improved forward kinematics that properly positions joints
function forwardKinematics() {
    // Set the angles for the bones based on IK solution
    bones[0].angle = theta1;
    bones[1].angle = theta1 + theta2;

    // Calculate joint positions
    bones[0].x = 0; // Upper arm origin
    bones[0].y = 0;

    // Position of elbow joint
    bones[1].x = L1 * Math.cos(theta1);
    bones[1].y = L1 * Math.sin(theta1);

    // Calculate end effector position (hand)
    let endX = bones[1].x + L2 * Math.cos(bones[1].angle);
    let endY = bones[1].y + L2 * Math.sin(bones[1].angle);

    return { x: endX, y: endY };
}

function degrees(rad) {
    return rad * 180 / Math.PI;
}


class MotionTween{
    // Doesn't actually lerp anything
    constructor(time, initVelocity, gravity, dragCoef, func){
        this.func = func
        this.duration = time
        this.velocity = initVelocity//vec3(0,0,0)
        this.gravity = gravity
        this.dragCoef = dragCoef
        this.pos = vec3(0,0,0)
        this.elapsedTime = 0

    }
    update(dt){
        this.elapsedTime += dt
        this.velocity = add(this.velocity, scale(dt, this.gravity))
        this.velocity = scale(this.dragCoef, this.velocity)
        this.pos = add(this.pos, scale(dt, this.velocity))
        this.func(this.pos, this.velocity)
    }
}

let TweenManager = {
    tweens: [],
    addTween: function(tween){
        this.tweens.push(tween)
    },
    update: function(dt){
        for (let i = this.tweens.length-1; i >= 0; i--){
            let tween = this.tweens[i]
            tween.update(dt)
            if (tween.elapsedTime > tween.duration){
                this.tweens.splice(i, 1)
            }
        }
    }
}


class Timeline {
    // time is in seconds
    constructor(duration){
        this.duration = duration
        this.elapsedTime = 0
        this.lastTriggerIndex = 0
        this.triggers = []
    }
    addTrigger(time, triggerFunc){
        this.triggers.push([time, triggerFunc])
        this.triggers.sort((a,b) => a[0] - b[0])
    }
    update(dt){
        this.elapsedTime += dt
        while (this.lastTriggerIndex < this.triggers.length && this.triggers[this.lastTriggerIndex][0] <= this.elapsedTime){
            this.triggers[this.lastTriggerIndex][1]()
            this.lastTriggerIndex++;
        }
        if (this.elapsedTime > this.duration){
            this.elapsedTime = 0
            this.lastTriggerIndex = 0
        }
    }

}


function degToRad(deg) {
    return deg * Math.PI / 180;
  }

function eulerToQuat(roll, pitch, yaw){
    roll = degToRad(roll)
    pitch = degToRad(pitch)
    yaw = degToRad(yaw)
    const cr = Math.cos(roll * 0.5);
    const sr = Math.sin(roll * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);
    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);

    return [sr * cp * cy - cr * sp * sy,
        cr * sp * cy + sr * cp * sy,
        cr * cp * sy - sr * sp * cy,
        cr * cp * cy + sr * sp * sy
    ]

}

// Converts a quaternion to an equivalent 4x4 matrix representation

function quatToMatrix(q) {
    const [x, y, z, w] = q;
    return new mat4(
        1 - 2 * (y * y + z * z), 2 * (x * y - w * z),     2 * (x * z + w * y),     0,
        2 * (x * y + w * z),     1 - 2 * (x * x + z * z), 2 * (y * z - w * x),     0,
        2 * (x * z - w * y),     2 * (y * z + w * x),     1 - 2 * (x * x + y * y), 0,
        0,                       0,                       0,                       1
    );
}


function magnitude(v){
    return Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])
}

function main()
{
    // Retrieve <canvas> element
    let canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    let gl = WebGLUtils.setupWebGL(canvas, undefined);

    //Check that the return value is not null.
    if (!gl)
    {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }


    // Initialize shaders
    let program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);

    // Set up the viewport
    gl.viewport( 0, 0, 400, 400);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.disable(gl.CULL_FACE);

    gl.cullFace(gl.BACK);

    // Define attribute pointers
    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);

    let vColor = gl.getAttribLocation(program, "vColor");
    gl.enableVertexAttribArray(vColor);

    // Get shader uniforms
    let uModel = gl.getUniformLocation(program, "modelMatrix");
    let uProj = gl.getUniformLocation(program, "projMatrix");
    let uCamera = gl.getUniformLocation(program, "cameraMatrix");


    // ---- BUILD FISH OUTSIDE render() ----
    let fishBody = new Model(gl);
    let fishTail = new Model(gl);
    let fishTopFin = new Model(gl);
    let fishBottomFin = new Model(gl);
    let fishHead = new Model(gl);
    let fishingRod = new Model(gl);
// Head - small cube in front
    singleColorCube(5); // Magenta color (or pick another)
    multCube(mult(translate(1.2, 0.0, 0.0), scalem(0.3, 0.3, 0.2)));
    fishHead.setData(gl, pointsArray, colorsArray);

// Parent it to body
    fishHead.setParent(fishBody);

// Transform relative to body
    fishHead.transform = translate(1.2, 0.0, 0.0);

// Body - main oval
    singleColorCube(2); // Yellow color
    multCube(scalem(2.0, 1.0, 1.0)); // Stretch in X direction
    fishBody.setData(gl, pointsArray, colorsArray);
    pointsArray = [];
    colorsArray = [];

    let tailVertices = [
        vec4(0.0, 0.0, 0.0, 1.0),        // base center
        vec4(-0.25, 0.0, 0.0, 1.0),      // base left
        vec4(0.25, 0.0, 0.0, 1.0),       // base right
        vec4(0.0, 0.5, 0.0, 1.0)         // tip
    ];

    function addFin(offsetX) {
        // Copy and offset each vertex in Z direction
        let v0 = add(tailVertices[0], vec4(offsetX, 0, 0, 0));
        let v1 = add(tailVertices[1], vec4(offsetX, 0, 0, 0));
        let v2 = add(tailVertices[2], vec4(offsetX, 0, 0, 0));
        let v3 = add(tailVertices[3], vec4(offsetX, 0, 0, 0));

        pointsArray.push(v1); colorsArray.push(vertexColors[4]);
        pointsArray.push(v0); colorsArray.push(vertexColors[4]);
        pointsArray.push(v3); colorsArray.push(vertexColors[4]);

        pointsArray.push(v0); colorsArray.push(vertexColors[4]);
        pointsArray.push(v2); colorsArray.push(vertexColors[4]);
        pointsArray.push(v3); colorsArray.push(vertexColors[4]);
    }

// Add left and right fins, offset in Z
    addFin(.7);  // left fin
    addFin(.15);   // right fin

    let tailScale = scalem(3.0, 4.0, 3.0);
    for (let i = 0; i < pointsArray.length; i++) {
        pointsArray[i] = mult(tailScale, pointsArray[i]);
    }

    fishTail.setData(gl, pointsArray, colorsArray);
    fishTail.transform = translate(-1.2, 0.0, 0.0);

// --- Manually build Top Fin ---
    pointsArray = [];
    colorsArray = [];

    let topFinVertices = [
        vec4(0.0, 0.0, 0.0, 1.0),        // base center
        vec4(-0.25, 0.0, 0.0, 1.0),      // base left
        vec4(0.25, 0.0, 0.0, 1.0),       // base right
        vec4(0.0, 0.5, 0.0, 1.0)         // top point
    ];

// two triangles
    pointsArray.push(topFinVertices[1]); colorsArray.push(vertexColors[6]); // white
    pointsArray.push(topFinVertices[0]); colorsArray.push(vertexColors[6]);
    pointsArray.push(topFinVertices[3]); colorsArray.push(vertexColors[6]);

    pointsArray.push(topFinVertices[0]); colorsArray.push(vertexColors[6]);
    pointsArray.push(topFinVertices[2]); colorsArray.push(vertexColors[6]);
    pointsArray.push(topFinVertices[3]); colorsArray.push(vertexColors[6]);
    let scaleMatrix = scalem(3.0, 3.5, 3.0); // scaling matrix

    for (let i = 0; i < pointsArray.length; i++) {
        pointsArray[i] = mult(scaleMatrix, pointsArray[i]);
    }
    fishTopFin.setData(gl, pointsArray, colorsArray);
    fishTopFin.transform = translate(0.0, 0.8, 0.0);

// --- Manually build Bottom Fin ---
    pointsArray = [];
    colorsArray = [];

    let bottomFinVertices = [
        vec4(0.0, 0.0, 0.0, 1.0),
        vec4(-0.25, 0.0, 0.0, 1.0),
        vec4(0.25, 0.0, 0.0, 1.0),
        vec4(0.0, -0.5, 0.0, 1.0)        // notice negative height
    ];

    pointsArray.push(bottomFinVertices[1]); colorsArray.push(vertexColors[6]);
    pointsArray.push(bottomFinVertices[0]); colorsArray.push(vertexColors[6]);
    pointsArray.push(bottomFinVertices[3]); colorsArray.push(vertexColors[6]);

    pointsArray.push(bottomFinVertices[0]); colorsArray.push(vertexColors[6]);
    pointsArray.push(bottomFinVertices[2]); colorsArray.push(vertexColors[6]);
    pointsArray.push(bottomFinVertices[3]); colorsArray.push(vertexColors[6]);
    scaleMatrix = scalem(3.0, 3.5, 3.0); // scaling matrix

    for (let i = 0; i < pointsArray.length; i++) {
        pointsArray[i] = mult(scaleMatrix, pointsArray[i]);
    }
    fishBottomFin.setData(gl, pointsArray, colorsArray);
    fishBottomFin.transform = translate(0.0, -.5, 0.0);

// Set parent relationships
    fishTail.setParent(fishBody);
    fishTopFin.setParent(fishBody);
    fishBottomFin.setParent(fishBody);

// Set local transforms
    fishBody.transform = mat4(); // Identity

    fishTail.transform = translate(-1.2, 0.0, 0.0);


    //
    //  let fishingRodSegments = []; // array to hold all rod pieces
    // let numSegments = 5; // how many cubes for the rod
    //
    // for (let i = 0; i < numSegments; i++) {
    //     let segment = new Model(gl);
    //
    //     colorCube(); // create cube
    //     multCube(scalem(0.05, 1, 0.05)); // make it thin and tall
    //     segment.setData(gl, pointsArray, colorsArray);
    //
    //     if (i == 0) {
    //         segment.setParent(null); // base of the rod, no parent
    //         segment.transform = translate(3.0, 0.0, 0.0); // place off to the right
    //     } else {
    //         segment.setParent(fishingRodSegments[i-1]); // chain to previous
    //         segment.transform = translate(0.0, .6, 0.0); // move upward
    //     }
    //     fishingRodSegments.push(segment);
    // }

    // Replace the existing rodWeights creation code with this improved version
// This creates better weight distribution for smoother bending
    let rodPoints = [];
    let rodWeights = [];
    let rodColors = [];
    let rodBoneCount = 5;

// Create rod vertices with manually defined weights
// Each segment consists of 12 vertices (6 vertices for front face, 6 for back face)

// Define segment positions
    for (let i = 0; i < rodBoneCount; i++) {
        // Position of current segment
        let yBase = i/10 * 1.0;
        let yTop = (i/10 + .01) * 1.0;

        // Two triangles for quad segment (front side)
        rodPoints.push(vec4(-0.05, yBase, 0.0, 1.0));    // 0
        rodPoints.push(vec4( 0.05, yBase, 0.0, 1.0));    // 1
        rodPoints.push(vec4( 0.05, yTop, 0.0, 1.0));     // 2

        rodPoints.push(vec4(-0.05, yBase, 0.0, 1.0));    // 3
        rodPoints.push(vec4( 0.05, yTop, 0.0, 1.0));     // 4
        rodPoints.push(vec4(-0.05, yTop, 0.0, 1.0));     // 5

        // Two triangles for quad segment (back side)
        rodPoints.push(vec4(-0.05, yBase, -0.02, 1.0));  // 6
        rodPoints.push(vec4( 0.05, yBase, -0.02, 1.0));  // 7
        rodPoints.push(vec4( 0.05, yTop, -0.02, 1.0));   // 8

        rodPoints.push(vec4(-0.05, yBase, -0.02, 1.0));  // 9
        rodPoints.push(vec4( 0.05, yTop, -0.02, 1.0));   // 10
        rodPoints.push(vec4(-0.05, yTop, -0.02, 1.0));   // 11

        // Brown color for each vertex
        for (let j = 0; j < 12; j++) {
            rodColors.push(vec4(0.65, 0.35, 0.2, 1.0)); // wooden brown
        }
    }

// Manually define weights for each vertex in each segment
// Format: [bone0_weight, bone1_weight, bone2_weight, bone3_weight, bone4_weight]

// SEGMENT 0 (Bottom segment)
// Bottom vertices (4 vertices - two at front, two at back)
    rodWeights.push(vec4(1.0, 0.0, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(1.0, 0.0, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(1.0, 0.0, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(1.0, 0.0, 0.0, 0.0, 0.0));

// Top vertices (8 vertices - four at front, four at back)
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));

// SEGMENT 1
// Bottom vertices (4 vertices)
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0)); 

// Top vertices (8 vertices)
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 

// SEGMENT 2
// Bottom vertices (4 vertices)
    rodWeights.push(vec4(0.0, 0.7, 0.3, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.7, 0.3, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.7, 0.3, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.7, 0.3, 0.0, 0.0)); 

// Top vertices (8 vertices)
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 

// SEGMENT 3
// Bottom vertices (4 vertices)
    rodWeights.push(vec4(0.0, 0.0, 0.9, 0.1, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.9, 0.1, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.9, 0.1, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.9, 0.1, 0.0)); 

// Top vertices (8 vertices)
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 

// SEGMENT 4 (Top segment)
// Bottom vertices (4 vertices)
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.2, 0.8)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.2, 0.8)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.2, 0.8)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.2, 0.8)); 

// Top vertices (8 vertices)
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 

// Buffers for deformable rod
    let rodPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rodPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(rodPoints), gl.STATIC_DRAW);
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

// Bone weights
    let rodWeightBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rodWeightBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(rodWeights), gl.STATIC_DRAW);
    let wAttrib = gl.getAttribLocation(program, "weights");
    gl.vertexAttribPointer(wAttrib, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(wAttrib);

// Color buffer
    let rodColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rodColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(rodColors), gl.STATIC_DRAW);
    let cAttrib = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(cAttrib, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cAttrib);
// ---- BUILD ARM ----
    upperArm = new Model(gl);
     forearm = new Model(gl);
     hand = new Model(gl);

// Create Upper Arm (flat and long)
    colorCube();
    multCube(scalem(0.3, 1.0, 0.3)); // skinny rectangle
    upperArm.setData(gl, pointsArray, colorsArray);
    upperArm.transform = translate(-10.0, 3.0, 0.0); // somewhere left of fish

// Create Forearm (attach to upper arm, rotated 90 degrees)
    colorCube();
    multCube(scalem(0.3, 1.0, 0.3));
    forearm.setData(gl, pointsArray, colorsArray);
    forearm.setParent(upperArm);
    forearm.transform = mult(translate(1.0, -1.0, 0.0), rotateZ(-90));

// Create Hand (small block at end of forearm)
    colorCube();
    multCube(scalem(0.2, 0.2, 0.2));
    hand.setData(gl, pointsArray, colorsArray);
    hand.setParent(forearm);
    hand.transform = translate(.0, 1.0, 0.0); // straight down from forearm tip



    // Create bait
    let bait = new Model(gl)
    singleColorCube(5);
    multCube(mult(translate(0, 0.0, 0.0), scalem(0.2, 0.1, 0.1)));
    bait.setData(gl, pointsArray, colorsArray);




    // Define function for drawing a model
    function drawModel(model, primitive) {
        gl.bindBuffer(gl.ARRAY_BUFFER, model.posBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

        // Set transform
        gl.uniformMatrix4fv(uModel, false, flatten(model.getWorldTransform()));

        gl.drawArrays(primitive, 0, model.bufferLength);
    }


    // Define fish spline path
    let fishSplinePos = [
        vec3(-10,-10,0),
        vec3(-1,-12,-1),
        vec3(-5,-8,-2),
        vec3(-2,-9,-4),
        vec3(-1,-8.5,-4),
        vec3(0,-1,-5),
        vec3(0,0,-4),
        vec3(-10,0,-5),
    ]
    let fishSplineRot = []
    for (let i = 0; i < fishSplinePos.length; i++){
        fishSplineRot.push(vec3())
    }
    let activeSpline = new Spline(10, fishSplinePos, fishSplineRot)


	// Define camera settings
	let cameraProjection = perspective(90,canvas.width/canvas.height,.1, 100);
    let cameraPos = vec3(5,5,5)
	let cameraTarget = vec3(0,5,0)

    // Timeline definition
    let timeline = new Timeline(10)
/// Improved timeline events for casting animation
    timeline.addTrigger(1, function() {
        // Wind up - dramatic arm bend with forearm rotated up
        TweenManager.addTween(new Tween(0.8, 0, 1, function(t) {
            let pullBackX = lerp(0.4, -0.1, t);
            let pullBackY = lerp(1.0, 1.8, t);
            updateArmIKToTarget(pullBackX, pullBackY);
        }));
    });

    timeline.addTrigger(2, function() {
        // Forward cast - visible forearm extension
        TweenManager.addTween(new Tween(0.4, 0, 1, function(t) {
            let castX = lerp(-0.1, 1.5, t);
            let castY = lerp(1.8, 0.5, t);
            updateArmIKToTarget(castX, castY);
        }));
    });

    timeline.addTrigger(2.5, function() {
        // Follow through - settle back with slight lift
        TweenManager.addTween(new Tween(0.5, 0, 1, function(t) {
            let followX = lerp(1.5, 1.3, t);
            let followY = lerp(0.5, 0.7, t);
            updateArmIKToTarget(followX, followY);
        }));
    });

    timeline.addTrigger(3.5, function() {
        // Subtle oscillation while holding rod
        TweenManager.addTween(new Tween(6.5, 0, 1, function(t) {
            let holdX = 1.3 + Math.sin(t * 6) * 0.03;  // match follow-through X position
            let holdY = 0.7 + (5*Math.sin(t * 4)) * 0.02;  // match follow-through Y position
            updateArmIKToTarget(holdX, holdY);
        }));
    });

// --- End FK/IK arm casting integration ---

// Timeline event for fishing rod bending
    timeline.addTrigger(1, function() {
        // Start rod bending right before the bait is cast
        TweenManager.addTween(new Tween(0.5, 0, 1, function(t) {
            // t goes from 0 to 1 over 0.5 seconds
            // This tween sets up an initial bend before casting
            // Actual animation handled in render loop

            // You can add any one-time setup here if needed
            // The rod bending animation will be handled in the render function
        }));
    });

// Add rod recoil after the bait is cast
    timeline.addTrigger(1.5, function() {
        TweenManager.addTween(new Tween(0.7, 1, 0, function(t) {
            // t goes from 1 to 0 over 0.7 seconds
            // This creates a recoil effect after casting
            // Actual animation handled in render loop
        }));
    });

// Add subtle rod motion when bait hits water
    timeline.addTrigger(3.207, function() {
        TweenManager.addTween(new Tween(0.5, 0, 1, function(t) {
            // t goes from 0 to 1 over 0.5 seconds
            // Creates a subtle vibration when bait hits water
            // Actual animation handled in render loop
        }));
    });
    timeline.addTrigger(2, function() {
        TweenManager.addTween(new Tween(2, 0, 1, function(t) {
            // t goes from 0 to 1 over 2 seconds

            // Max bend angle (in degrees)
            let maxAngle = 45;

            // for (let i = 1; i < fishingRodSegments.length; i++) {
            //     // Interpolate angle based on segment index and t
            //     let angle = t * (i / fishingRodSegments.length) * maxAngle;
            //
            //     // Set transform: rotate and translate upward
            //     fishingRodSegments[i].transform = mult(
            //         translate(0.0, 0.6, 0.0),
            //         rotateZ(-angle)
            //     );
            // }
        }));
    });

    //Move fish
    timeline.addTrigger(0, function(){
        TweenManager.addTween(new Tween(10, 0, 1, function(a){
            let splinePos = findCatmullRomPoint(activeSpline.posPoints, (elapsedTime+0.03)/activeSpline.time)
            let splinePos2 = findCatmullRomPoint(activeSpline.posPoints, (elapsedTime)/activeSpline.time)

            if (!equal(cross(vec3(splinePos2),vec3(splinePos)), vec3())){ // Handle edge case when cross vector becomes zero
                lookAtTransform = inverse(lookAt(vec3(splinePos2), vec3(splinePos), vec3(0, 1, 0)))
            }
            fishBody.transform = mult(lookAtTransform, rotateY(-90))
        }))
    })
    // Throw bait
    timeline.addTrigger(0, function(){
        bait.transform = translate(vec3(-5,4,0))
    })
    timeline.addTrigger(1, function(){
        let startPos = vec3(-5,4,0)
        TweenManager.addTween(new MotionTween(2.207, vec3(3,16,0), vec3(0,-16,0), 1, function(offset, vel){
            bait.transform = translate(add(startPos, offset))
        }))
    })
    timeline.addTrigger(3.207, function(){
        let startPos = vec3(1.5,0,0)
        TweenManager.addTween(new MotionTween(7, vec3(0,-32,0), vec3(0,-16,0), 0.8, function(offset, vel){
            bait.transform = translate(add(startPos, offset))
        }))
    })

    // Camera pan
    timeline.addTrigger(0, function(){
        elapsedTime=0
        cameraPos = vec3(5,5,5)
        cameraTarget = vec3(0,5,0)
    })
    timeline.addTrigger(2, function(){
        TweenManager.addTween(new Tween(4, 5, -2, function(a){
            cameraPos = vec3(5,a,5)
            cameraTarget = vec3(0,a,0)
        }))
    })


    let reset = true
    let elapsedTime = 0
    let distTravelled = 0
    let lastTime = 0
    let accumulatedTime = 0
    let lookAtTransform = mat4()
    function render(currTime){
        let modelMatrixLoc = gl.getUniformLocation(program,'modelMatrix')
        modelMatrix = rotateX(180)
        gl.uniformMatrix4fv(modelMatrixLoc,false,flatten(modelMatrix))
        if (reset){ // Reset animation timeline state
            reset = false
            lastTime = currTime
            elapsedTime = 0
            distTravelled = 0
        }
        // Set projection
        gl.uniformMatrix4fv(uProj, false, flatten(cameraProjection));
        gl.uniformMatrix4fv(uCamera, false, flatten(lookAt(cameraPos,cameraTarget,vec3(0,1,0))));

        // Clear buffers
        gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);






        // Animate the fish movement
        let delta = (currTime - lastTime)/1000
        accumulatedTime += delta


        while (accumulatedTime > 1/60){
            timeline.update(1/60)
            TweenManager.update(1/60)
            accumulatedTime -= 1/60
        }

        drawModel(fishHead,gl.TRIANGLES);
        drawModel(fishBody, gl.TRIANGLES);
        drawModel(fishTail, gl.TRIANGLES);
        drawModel(fishTopFin, gl.TRIANGLES);
        drawModel(fishBottomFin, gl.TRIANGLES);


        // for (let segment of fishingRodSegments) {
        //     drawModel(segment, gl.TRIANGLES);
        // }






// Update the rod bone animation in the render function

// Rod bone animation section
        let rodBones = [];
        for (let i = 0; i < rodBoneCount; i++) {
            // Create more natural bending by having increasing angles down the rod
            // Timeline-based animation with sine wave for gentle oscillation
            let baseAngle = 0;
            let finalBendAngle = -15; // Maintain a slight bend after animation completes

            // Add increasing bend when triggered by timeline events
            if (elapsedTime > 2) {
                let bendFactor;
                if (elapsedTime < 3.5) {
                    // Initial forward bend when casting (2 to 3.5 seconds)
                    bendFactor = Math.min(1, (elapsedTime - 2) / 1.5); // 0 to 1
                    baseAngle = -45 * bendFactor * ((i + 1) / rodBoneCount); // BIGGER bend
                } else if (elapsedTime < 6) {
                    // Recoil and settle from 3.5 to 6
                    let recoilProgress = (elapsedTime - 3.5) / 2.5; // 0 to 1
                    // Blend from maximum bend (-45) to final bend angle (-15)
                    baseAngle = (-45 + ((-45 - finalBendAngle) * recoilProgress)) * ((i + 1) / rodBoneCount);
                } else {
                    // After 6 seconds, maintain the final bend angle
                    baseAngle = finalBendAngle * ((i + 1) / rodBoneCount);
                }
            }

            // Add gentle oscillation - reduce amplitude over time for natural damping
            let oscillationAmplitude = 5;
            if (elapsedTime > 3.5) {
                // Gradually reduce oscillation amplitude after the cast
                oscillationAmplitude = 5 * Math.max(0.2, Math.min(1, 3 / (elapsedTime - 3)));
            }

            let oscillation = Math.sin(elapsedTime * 2 + i * 0.3) * oscillationAmplitude * ((i + 1) / rodBoneCount);
            if(elapsedTime>1){
                bendFactor = Math.min(1, (elapsedTime - 2) / 1.5); // 0 to 1
                baseAngle = -45 * bendFactor * ((i + 1) / rodBoneCount); // BIGGER bend
            }
           else{
               baseAngle = 0;
            }
            // Combine base angle with oscillation
            let angle = baseAngle + oscillation;

            // Create transformation matrices
            let rotation = rotateZ(angle/1.3);

            // Position offset between bones
            let offset = translate(0.0, 1.0, 0.0);

            // IMPORTANT: For bone skinning, we need to create each bone matrix relative to bind pose
            // So we build each bone's matrix by multiplying previous bone matrices
            if (i === 0) {
                // First bone - set position
                rodBones[i] = mult(translate(3.0, 0.0, 0.0), rotation);
            } else {
                // Subsequent bones - inherit parent transformation and add local one
                rodBones[i] = mult(rodBones[i-1], mult(offset, rotation));
            }

            // Send bone matrix to shader
            gl.uniformMatrix4fv(gl.getUniformLocation(program, `boneMatrix${i}`), false, flatten(rodBones[i]));
        }

// Make sure to add this uniform to enable bone skinning when drawing the rod
        gl.uniform1i(gl.getUniformLocation(program, "useBones"), true);

// Draw the skinned fishing rod
        gl.bindBuffer(gl.ARRAY_BUFFER, rodPositionBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, rodWeightBuffer);
        gl.vertexAttribPointer(wAttrib, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(wAttrib);

// Set model matrix to position the entire rod
        gl.uniformMatrix4fv(uModel, false, flatten(mult(hand.getWorldTransform(), mult(translate(-2.3, -2.0, 0.0),rotateZ(45)))));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, rodPoints.length);

// Reset the bone usage for other objects
        gl.uniform1i(gl.getUniformLocation(program, "useBones"), false);
// Draw the skinned fishing rod
        gl.bindBuffer(gl.ARRAY_BUFFER, rodPositionBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, rodWeightBuffer);
        gl.vertexAttribPointer(wAttrib, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(wAttrib);

// Set model matrix to position the entire rod
        gl.uniformMatrix4fv(uModel, false, flatten(mult(hand.getWorldTransform(), mult(translate(-2.3, -2.0, 0.0),rotateZ(45)))));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, rodPoints.length);

// Reset the bone usage for other objects
        gl.uniform1i(gl.getUniformLocation(program, "useBones"), false);










        gl.uniform1i(gl.getUniformLocation(program, "useBones"), false);

        drawModel(bait, gl.TRIANGLES)

        drawModel(upperArm, gl.TRIANGLES);
        drawModel(forearm, gl.TRIANGLES);
        drawModel(hand, gl.TRIANGLES);
        lastTime = currTime
        elapsedTime += delta
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


}



// Improved function to update arm model transforms
function updateArmIKToTarget(targetX, targetY) {
    // Solve IK for the target position
    inverseKinematics(targetX, targetY);
    forwardKinematics();

    // Update upper arm transform
    // Start with the base position, then rotate around Z axis
    upperArm.transform = mult(
        translate(-10.0, 3.0, 0.0),  
        rotateZ(degrees(theta1))
    );


    // Update forearm transform
    // This is a local transform relative to the upper arm
    // The forearm should be attached at the end of the upper arm
    console.log(theta2)
    forearm.transform = mult(
        translate(1.0, -1.0, 0.0),  // Move to end of upper arm
        rotateZ(degrees(-theta2))   // Apply the elbow angle
    );

    // Update hand transform - position at end of forearm
    hand.transform = translate(0.0, 1.0, 0.0);
}

function createFin(color) {
    pointsArray.length = 0;
    colorsArray.length = 0;

    // Define a thin triangle (flat, in XY plane)
    let baseSize = 0.5;
    let height = 0.5;

    let v0 = vec4(0.0, 0.0, 0.0, 1.0);        // base center
    let v1 = vec4(-baseSize/2, 0.0, 0.0, 1.0); // base left
    let v2 = vec4(baseSize/2, 0.0, 0.0, 1.0);  // base right
    let v3 = vec4(0.0, height, 0.0, 1.0);      // top point

    // Two triangles: (v1, v0, v3) and (v0, v2, v3)
    pointsArray.push(v1); colorsArray.push(vertexColors[color]);
    pointsArray.push(v0); colorsArray.push(vertexColors[color]);
    pointsArray.push(v3); colorsArray.push(vertexColors[color]);

    pointsArray.push(v0); colorsArray.push(vertexColors[color]);
    pointsArray.push(v2); colorsArray.push(vertexColors[color]);
    pointsArray.push(v3); colorsArray.push(vertexColors[color]);
}
function multFin(m){
    for (let i = 0; i < pointsArray.length; i++){
        pointsArray[i] = mult(m, pointsArray[i]);
    }
}
