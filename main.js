/*
    CS 4732 - Final Project
*/
let rodBaseAngle = 0; //variable to track base rod bend


//function to linearly interpolate between points based on t
function lerp(a, b, t) {
    return (1 - t) * a + t * b;
}
let upperArm,forearm,hand
let usingCatmullRom = false

function activatecatmull(){
    usingCatmullRom = true
}

function activatebspline(){
    usingCatmullRom = false
}

//constructing a colored cube data storage
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

//fills pointsArray and colorArray with vertex position and color data
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

//applies matrix on current cube
function multCube(m){
    for (i = 0; i < pointsArray.length; i++){
        pointsArray[i] = mult(m, pointsArray[i])
    }
}

//same thing but only one color instead
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


//container for model data
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

// kinematics skeletal animation logic for arm movement
let bones = [
    { x: 0, y: 0, angle: 0, length: 1 }, //upper arm
    { x: 0, y: 0, angle: 0, length: 1 }  //forearm
];
let target = { x: 0.4, y: 1.0 }; //target that arm reaches towards

//ICE IK function, calculates joint angles
function inverseKinematics(targetX, targetY) {
    L1 = bones[0].length;
    L2 = bones[1].length;

    //calculate distance to target
    let distance = Math.sqrt(targetX * targetX + targetY * targetY);

    //clamp distance to maximum reach
    distance = Math.min(distance, L1 + L2 - 0.01);

    //calculate joint angles cosines
    let cos_theta2 = (distance*distance - L1*L1 - L2*L2) / (2 * L1 * L2);
    //clamp to valid range to avoid NaN
    cos_theta2 = Math.max(-1, Math.min(1, cos_theta2));

    //theta2 - angle of the elbow
    theta2 = Math.acos(cos_theta2);

    //theta1 - angle of the shoulder
    let targetAngle = Math.atan2(targetY, targetX);
    let phi = Math.atan2(L2 * Math.sin(theta2), L1 + L2 * Math.cos(theta2));
    theta1 = targetAngle - phi;
}

//ICE forward kinematics for positions joints
function forwardKinematics() {
    //set the angles for the bones based on IK
    bones[0].angle = theta1;
    bones[1].angle = theta1 + theta2;

    //calculate joint positions
    bones[0].x = 0; //upper arm origin
    bones[0].y = 0;

    //position of elbow joint
    bones[1].x = L1 * Math.cos(theta1);
    bones[1].y = L1 * Math.sin(theta1);

    //hand position
    let endX = bones[1].x + L2 * Math.cos(bones[1].angle);
    let endY = bones[1].y + L2 * Math.sin(bones[1].angle);

    return { x: endX, y: endY };
}

function degrees(rad) {
    return rad * 180 / Math.PI;
}


class MotionTween{
    //Doesn't actually lerp anything
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
    //time is in seconds
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
    roll = roll
    pitch = pitch
    yaw = yaw
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


    //BUILDING FISH HERE
    let fishBody = new Model(gl);
    let fishTail = new Model(gl);
    let fishTopFin = new Model(gl);
    let fishBottomFin = new Model(gl);
    let fishHead = new Model(gl);
    let fishingRod = new Model(gl);
//Head: small cube in front
    singleColorCube(5); //Magenta color (or pick another)
    multCube(mult(translate(1.2, 0.0, 0.0), scalem(0.3, 0.3, 0.2)));
    fishHead.setData(gl, pointsArray, colorsArray);

//make body its parent, hierarchical
    fishHead.setParent(fishBody);

//move in place
    fishHead.transform = translate(1.2, 0.0, 0.0);

//Body: main rectangle
    singleColorCube(2); //yellow color
    multCube(scalem(2.0, 1.0, 1.0)); //stretch in X direction
    fishBody.setData(gl, pointsArray, colorsArray);
    pointsArray = [];//clear points and colors after setting data
    colorsArray = [];

    let tailVertices = [
        vec4(0.0, 0.0, 0.0, 1.0),        //cube fin, tail of fish
        vec4(-0.25, 0.0, 0.0, 1.0),
        vec4(0.25, 0.0, 0.0, 1.0),
        vec4(0.0, 0.5, 0.0, 1.0)
    ];


    //used to add a fin in some direction, doesnt draw
    function addFin(offsetX) {
        //copy and offset each vertex in X direction
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

//add left and right fins, offset on x for the top fin
    addFin(.7);  //left fin
    addFin(.15);   //right fin






    //creation of the tail fin, small cube in the back of the fish
    let tailScale = scalem(3.0, 4.0, 3.0);
    for (let i = 0; i < pointsArray.length; i++) {
        pointsArray[i] = mult(tailScale, pointsArray[i]);
    }

    fishTail.setData(gl, pointsArray, colorsArray);
    fishTail.transform = translate(-1.2, 0.0, 0.0);







//top fin creation
    pointsArray = [];
    colorsArray = [];

    let topFinVertices = [
        vec4(0.0, 0.0, 0.0, 1.0),
        vec4(-0.25, 0.0, 0.0, 1.0),
        vec4(0.25, 0.0, 0.0, 1.0),
        vec4(0.0, 0.5, 0.0, 1.0)
    ];

//two triangles
    pointsArray.push(topFinVertices[1]); colorsArray.push(vertexColors[6]); //white
    pointsArray.push(topFinVertices[0]); colorsArray.push(vertexColors[6]);
    pointsArray.push(topFinVertices[3]); colorsArray.push(vertexColors[6]);



    pointsArray.push(topFinVertices[0]); colorsArray.push(vertexColors[6]);
    pointsArray.push(topFinVertices[2]); colorsArray.push(vertexColors[6]);
    pointsArray.push(topFinVertices[3]); colorsArray.push(vertexColors[6]);
    let scaleMatrix = scalem(3.0, 3.5, 3.0); //scaling matrix

    for (let i = 0; i < pointsArray.length; i++) {
        pointsArray[i] = mult(scaleMatrix, pointsArray[i]);
    }
    fishTopFin.setData(gl, pointsArray, colorsArray);
    fishTopFin.transform = translate(0.0, 0.8, 0.0);







//bottom fin creation
    pointsArray = [];
    colorsArray = [];

    let bottomFinVertices = [
        vec4(0.0, 0.0, 0.0, 1.0),//same vertices as top fin, but with negative height on hte final vertice
        vec4(-0.25, 0.0, 0.0, 1.0),
        vec4(0.25, 0.0, 0.0, 1.0),
        vec4(0.0, -0.5, 0.0, 1.0)
    ];

    pointsArray.push(bottomFinVertices[1]); colorsArray.push(vertexColors[6]);
    pointsArray.push(bottomFinVertices[0]); colorsArray.push(vertexColors[6]);
    pointsArray.push(bottomFinVertices[3]); colorsArray.push(vertexColors[6]);



    pointsArray.push(bottomFinVertices[0]); colorsArray.push(vertexColors[6]);
    pointsArray.push(bottomFinVertices[2]); colorsArray.push(vertexColors[6]);
    pointsArray.push(bottomFinVertices[3]); colorsArray.push(vertexColors[6]);
    scaleMatrix = scalem(3.0, 3.5, 3.0); //scaling matrix

    for (let i = 0; i < pointsArray.length; i++) {
        pointsArray[i] = mult(scaleMatrix, pointsArray[i]);
    }
    fishBottomFin.setData(gl, pointsArray, colorsArray);
    fishBottomFin.transform = translate(0.0, -.5, 0.0);




//setting parent relationships
    fishTail.setParent(fishBody);
    fishTopFin.setParent(fishBody);
    fishBottomFin.setParent(fishBody);






//set positions
    fishBody.transform = mat4();

    fishTail.transform = translate(-1.2, 0.0, 0.0);

//WHY NOT WORKING
    //
    // let fishingRodSegments = []; //array to hold all rod pieces
    //let numSegments = 5; //how many cubes for the rod
    //
    // for (let i = 0; i < numSegments; i++) {
    //     let segment = new Model(gl);
    //
    //     colorCube(); //create cube
    //     multCube(scalem(0.05, 1, 0.05)); //make it thin and tall
    //     segment.setData(gl, pointsArray, colorsArray);
    //
    //     if (i == 0) {
    //         segment.setParent(null); //base of the rod, no parent
    //         segment.transform = translate(3.0, 0.0, 0.0); //place off to the right
    //     } else {
    //         segment.setParent(fishingRodSegments[i-1]); //chain to previous
    //         segment.transform = translate(0.0, .6, 0.0); //move upward
    //     }
    //     fishingRodSegments.push(segment);
    // }


    //the creation and placement of my fishing rod
    let rodPoints = [];
    let rodWeights = [];
    let rodColors = [];
    let rodBoneCount = 5;

//creating rod vertices with manually defined weights so that I can adjust them easier
//each segment consists of 12 vertices, 6 for front and 6 for back

//define segment positions
    for (let i = 0; i < rodBoneCount; i++) {
        let yBase = i/10 * 1.0;
        let yTop = (i/10 + .01) * 1.0;

        //two triangles for quad segment front.  I have two sides defined because I didn't realize back face culling
        //was causing my object to disappear, so I created two sides of each shape in order to remedy this problem
        //instead of just disabling culling
        rodPoints.push(vec4(-0.05, yBase, 0.0, 1.0));    //0
        rodPoints.push(vec4( 0.05, yBase, 0.0, 1.0));    //1
        rodPoints.push(vec4( 0.05, yTop, 0.0, 1.0));     //2

        rodPoints.push(vec4(-0.05, yBase, 0.0, 1.0));    //3
        rodPoints.push(vec4( 0.05, yTop, 0.0, 1.0));     //4
        rodPoints.push(vec4(-0.05, yTop, 0.0, 1.0));     //5

        //two triangles for quad segment  back
        rodPoints.push(vec4(-0.05, yBase, -0.02, 1.0));  //6
        rodPoints.push(vec4( 0.05, yBase, -0.02, 1.0));  //7
        rodPoints.push(vec4( 0.05, yTop, -0.02, 1.0));   //8

        rodPoints.push(vec4(-0.05, yBase, -0.02, 1.0));  //9
        rodPoints.push(vec4( 0.05, yTop, -0.02, 1.0));   //10
        rodPoints.push(vec4(-0.05, yTop, -0.02, 1.0));   //11


        for (let j = 0; j < 12; j++) {
            rodColors.push(vec4(173/255,216/255,230/255))//light blue rod
        }
    }

//manually define weights for each vertex in each segment
//format: bone0weight, bone1weight, bone2weight, bone3weight, bone4weight

//SEGMENT 0
//bottom vertices 4 vertices, two at front, two at back
    rodWeights.push(vec4(1.0, 0.0, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(1.0, 0.0, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(1.0, 0.0, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(1.0, 0.0, 0.0, 0.0, 0.0));

//top vertices 8 vertices, four at front, four at back
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0));

//SEGMENT 1

    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.7, 0.3, 0.0, 0.0, 0.0)); 


    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 
    rodWeights.push(vec4(0.3, 0.7, 0.0, 0.0, 0.0)); 

//SEGMENT 2
    rodWeights.push(vec4(0.0, 0.7, 0.3, 0.0, 0.0));
    rodWeights.push(vec4(0.0, 0.7, 0.3, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.7, 0.3, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.7, 0.3, 0.0, 0.0)); 

    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0));
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 
    rodWeights.push(vec4(0.0, 0.3, 0.7, 0.0, 0.0)); 

//SEGMENT 3
    rodWeights.push(vec4(0.0, 0.0, 0.9, 0.1, 0.0));
    rodWeights.push(vec4(0.0, 0.0, 0.9, 0.1, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.9, 0.1, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.9, 0.1, 0.0)); 

    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0));
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.1, 0.9, 0.0)); 

//SEGMENT 4 (Top segment)
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.2, 0.8));
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.2, 0.8)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.2, 0.8)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.2, 0.8)); 

    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0));
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 
    rodWeights.push(vec4(0.0, 0.0, 0.0, 0.0, 1.0)); 







//buffers for the rod
    let rodPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rodPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(rodPoints), gl.STATIC_DRAW);
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

//bone weights
    let rodWeightBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rodWeightBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(rodWeights), gl.STATIC_DRAW);
    let wAttrib = gl.getAttribLocation(program, "weights");
    gl.vertexAttribPointer(wAttrib, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(wAttrib);

//color buffer
    let rodColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rodColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(rodColors), gl.STATIC_DRAW);
    let cAttrib = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(cAttrib, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cAttrib);






    //buliding of arm starts here
    upperArm = new Model(gl);
     forearm = new Model(gl);
     hand = new Model(gl);

//create Upper Arm
    colorCube();
    multCube(scalem(0.3, 1.0, 0.3)); //skinny rectangle
    upperArm.setData(gl, pointsArray, colorsArray);
    upperArm.transform = translate(-10.0, 8.0, 0.0); //somewhere left of fish

//create Forearm, attach to upper arm
    colorCube();
    multCube(scalem(0.3, 1.0, 0.3));
    forearm.setData(gl, pointsArray, colorsArray);
    forearm.setParent(upperArm);
    forearm.transform = mult(translate(1.0, -1.0, 0.0), rotateZ(-90));

//create hand, attached to forearm
    colorCube();
    multCube(scalem(0.2, 0.2, 0.2));
    hand.setData(gl, pointsArray, colorsArray);
    hand.setParent(forearm);
    hand.transform = translate(.0, 1.0, 0.0); //straight down from forearm tip






    //create bait
    let bait = new Model(gl)
    singleColorCube(5);
    multCube(mult(translate(0, 0.0, 0.0), scalem(0.2, 0.1, 0.1)));
    bait.setData(gl, pointsArray, colorsArray);




    //create fishing line
    let fishingLine = new Model(gl);
    singleColorCube(6); //6 = white
    multCube(scalem(0.02, 1.0, 0.02));  //thin and tall
    fishingLine.setData(gl, pointsArray, colorsArray);




    //create ocean background, send far back
    let oceanBackground = new Model(gl);
    singleColorCube(4); //blue

//rotating the ocean backgorund
    let rotation = rotateY(45);

//combine transformations for ocean, scale wide, move a lot because z is far back. Needs to be in the background
    let oceanTransform = mult(translate(-40, -50, -50), mult(rotation, scalem(100, 50, 0.1)));

    multCube(oceanTransform);
    oceanBackground.setData(gl, pointsArray, colorsArray);

    //define function for drawing a model
    function drawModel(model, primitive) {
        gl.bindBuffer(gl.ARRAY_BUFFER, model.posBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

        //Set transform
        gl.uniformMatrix4fv(uModel, false, flatten(model.getWorldTransform()));

        gl.drawArrays(primitive, 0, model.bufferLength);
    }




    //Define fish spline path
    let fishSplinePos = [
        vec3(-10,-10,0),
        vec3(-1,-12,-1),
        vec3(-5,-8,-2),
        vec3(-2,-9,-4),
        vec3(-1,-8.5,-4),
        vec3(0,-4,-5),
        vec3(0,-4,-4),
        vec3(-10,-4,-5),
    ]
    let fishSplineRot = []
    for (let i = 0; i < fishSplinePos.length; i++){
        // generate euler rotations for spline by taking angle of vector from previous pos to current pos 
        let offset = normalize(subtract(fishSplinePos[i], fishSplinePos[(i+fishSplinePos.length-1)%fishSplinePos.length]))
        fishSplineRot.push(eulerToQuat(
            0,
            Math.asin(offset[1]),
            Math.atan2(offset[2], offset[0])
        ))
    }
    let activeSpline = new Spline(10, fishSplinePos, fishSplineRot)


	// Define camera settings
	let cameraProjection = perspective(90,canvas.width/canvas.height,.1, 100);
    let cameraPos = vec3(5,5,5)
	let cameraTarget = vec3(0,5,0)






    // Timeline definition
    let timeline = new Timeline(10)
    timeline.addTrigger(1, function() {
        // wind up, arm bend with forearm rotated up
        TweenManager.addTween(new Tween(0.8, 0, 1, function(t) {
            let pullBackX = lerp(0.4, -0.1, t);
            let pullBackY = lerp(1.0, 1.8, t);
            updateArmIKToTarget(pullBackX, pullBackY);
        }));
    });

    timeline.addTrigger(2, function() {
        //forward cast, visible forearm extension
        TweenManager.addTween(new Tween(0.4, 0, 1, function(t) {
            let castX = lerp(-0.1, 1.5, t);
            let castY = lerp(1.8, 0.5, t);
            updateArmIKToTarget(castX, castY);
        }));
    });

    timeline.addTrigger(2.5, function() {
        //follow through, settle back with slight lift
        TweenManager.addTween(new Tween(0.5, 0, 1, function(t) {
            let followX = lerp(1.5, 1.3, t);
            let followY = lerp(0.5, 0.7, t);
            updateArmIKToTarget(followX, followY);
        }));
    });

    timeline.addTrigger(3.5, function() {
        //subtle oscillation while holding rod
        TweenManager.addTween(new Tween(6.5, 0, 1, function(t) {
            let holdX = 1.3 + Math.sin(t * 6) * 0.03;  //match follow-through X position
            let holdY = 0.7 + (5*Math.sin(t * 4)) * 0.02;  //match follow-through Y position
            updateArmIKToTarget(holdX, holdY);
        }));
    });


// Timeline event for fishing rod bending
    timeline.addTrigger(1, function() {
        //start rod bending right before the bait is cast
        TweenManager.addTween(new Tween(0.5, 0, 1, function(t) {

        }));
    });

    timeline.addTrigger(1.5, function() {
        TweenManager.addTween(new Tween(0.7, 1, 0, function(t) {

        }));
    });

//subtle rod motion when bait hits water
    timeline.addTrigger(3.207, function() {
        TweenManager.addTween(new Tween(0.5, 0, 1, function(t) {

        }));
    });
    timeline.addTrigger(2, function() {
        TweenManager.addTween(new Tween(2, 0, 1, function(t) {

            let maxAngle = 45;


        }));
    });

    //move fish
    timeline.addTrigger(0, function(){
        TweenManager.addTween(new Tween(10, 0, 1, function(a){
            // find rotation of tangent through taking average slerp from sampling the angle of two tiny vectors on the spline
            let splinePos = findCatmullRomPoint(activeSpline.posPoints, (elapsedTime+0.03)/activeSpline.time)
            let splinePos2 = findCatmullRomPoint(activeSpline.posPoints, (elapsedTime)/activeSpline.time)
            let splinePos3 = findCatmullRomPoint(activeSpline.posPoints, (elapsedTime+0.06)/activeSpline.time)
            let offset1 = normalize(subtract(splinePos3,splinePos))
            let offset2 = normalize(subtract(splinePos,splinePos2))
            
            let splineRot1 = eulerToQuat(
                Math.asin(offset1[1]),
                -Math.atan2(offset1[0], offset1[2]),
                0
            )
            let splineRot2 = eulerToQuat(
                Math.asin(offset2[1]),
                -Math.atan2(offset2[0], offset2[2]),
                0
            )
            fishBody.transform = mult(translate(splinePos[0],splinePos[1],splinePos[2]), mult(quatToMatrix(slerp(splineRot1,splineRot2,0.5)), rotateY(-90)))
        }))
    })

    // Throw bait
    // Start position
    timeline.addTrigger(0, function(){ 
        bait.transform = translate(vec3(-5,6,0))
    })
    // Windup
    timeline.addTrigger(1, function(){
        TweenManager.addTween(new Tween(1, 0, 1, function(a){
            bait.transform = translate(vec3(-5 - a*a*a *3,a*a*4+6,0))
        }))
    })
    // Cast
    timeline.addTrigger(2.1, function(){
        let startPos = vec3(-8,7,0)
        TweenManager.addTween(new MotionTween(2.207, vec3(4.3,16,0), vec3(0,-17.5,0), 1, function(offset, vel){
            bait.transform = translate(add(startPos, offset))
        }))
    })
    // Sinking
    timeline.addTrigger(4.207, function(){
        let startPos = vec3(1.5,0,0)
        TweenManager.addTween(new MotionTween(4, vec3(0,-32,0), vec3(0,-16,0), 0.8, function(offset, vel){
            bait.transform = translate(add(startPos, offset))
        }))
    })

    // Camera starting position
    timeline.addTrigger(0, function(){
        elapsedTime=0
        cameraPos = vec3(5,5,5)
        cameraTarget = vec3(0,5,0)
    })
    // Camera pan
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

        drawModel(oceanBackground, gl.TRIANGLES);





        //animate the fish movement
        let delta = (currTime - lastTime)/1000
        accumulatedTime += delta


        while (accumulatedTime>1/60){
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







//rod bone animation section
        let rodBones = [];
        for (let i = 0; i < rodBoneCount; i++) {
            let baseAngle = 0;
            let finalBendAngle = -15; //maintain a slight bend after animation completes

            //add increasing bend when triggered by timeline events
            if (elapsedTime>2) {
                let bendFactor;
                if (elapsedTime<3.5) {
                    //initial forward bend when casting (2 to 3.5 seconds)
                    bendFactor = Math.min(1, (elapsedTime-2)/1.5); //0 to 1
                    baseAngle = -45*bendFactor* ((i+1)/rodBoneCount); //bigger bend
                } else if (elapsedTime<6) {
                    //recoil and settle from 3.5 to 6
                    let recoilProgress = (elapsedTime-3.5)/2.5;
                    //blend from maximum bend to final angle
                    baseAngle = (-45 + ((-45-finalBendAngle)*recoilProgress)) * ((i+1)/rodBoneCount);
                } else {
                    //after 6 seconds, maintain the final bend angle
                    baseAngle = finalBendAngle* ((i+1)/rodBoneCount);
                }
            }

            //gentle oscillation
            let oscillationAmplitude = 5;
            if (elapsedTime>3.5) {
                oscillationAmplitude = 5*Math.max(0.2, Math.min(1, 3/ (elapsedTime-3)));//osscilation decreases with time
            }

            let oscillation = Math.sin(elapsedTime*2+i*0.3) *oscillationAmplitude* ((i+1)/rodBoneCount);




            //I think the above section can be disregarded but I don't want to touch it for fear of breaking.
            //animation timers were off, so I just decided to set elapsed time within the timeline triggers for camera panning


            if(elapsedTime>1){
                bendFactor = Math.min(1, (elapsedTime-2)/1.5);
                baseAngle = -45*bendFactor*((i+1)/rodBoneCount); //straight if before 1, bend if after
            }
           else{
               baseAngle = 0;
            }
            //combine base angle with oscillation
            let angle = baseAngle+oscillation;
            let rotation = rotateZ(angle/1.3);

            //position offset between bones
            let offset = translate(0.0, 1.0, 0.0);

            //build each bone's matrix by multiplying previous bone matrices here, ICE logic implemented
            if (i===0) {
                //first bone
                rodBones[i] = mult(translate(3.0, 0.0, 0.0), rotation);
            } else {
                //for other bones, inherit parent transformation and add local transformations
                rodBones[i] = mult(rodBones[i-1], mult(offset, rotation));
            }

            //send bone matrix
            gl.uniformMatrix4fv(gl.getUniformLocation(program, `boneMatrix${i}`), false, flatten(rodBones[i]));
        }

        gl.uniform1i(gl.getUniformLocation(program, "useBones"), true);

//draw the fishing rod
        gl.bindBuffer(gl.ARRAY_BUFFER, rodPositionBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, rodWeightBuffer);
        gl.vertexAttribPointer(wAttrib, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(wAttrib);

//position the entire rod
        gl.uniformMatrix4fv(uModel, false, flatten(mult(hand.getWorldTransform(), mult(translate(-2.3, -2.0, 0.0),rotateZ(45)))));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, rodPoints.length);

//bone usage for other objects
        gl.uniform1i(gl.getUniformLocation(program, "useBones"), false);
//draw
        gl.bindBuffer(gl.ARRAY_BUFFER, rodPositionBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, rodWeightBuffer);
        gl.vertexAttribPointer(wAttrib, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(wAttrib);

        gl.uniformMatrix4fv(uModel, false, flatten(mult(hand.getWorldTransform(), mult(translate(-2.3, -2.0, 0.0),rotateZ(45)))));

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, rodPoints.length);

//reset the bone usage such that other objects use normal drawing, seen in shader
        gl.uniform1i(gl.getUniformLocation(program, "useBones"), false);






//rod tip position based on the last bone transformation
        let rodTipBoneMatrix = rodBones[rodBoneCount-1];
//apply the model matrix of the rod to get world coordinates
        let rodModelMatrix = mult(hand.getWorldTransform(), mult(translate(-2.3, -2.0, 0.0), rotateZ(45)));
//combine the matrices
        let rodTipWorldMatrix = mult(rodModelMatrix, rodTipBoneMatrix);
//get position from the last bone matrix and add an offset for the tip of the rod
        let start = vec3(
            rodTipWorldMatrix[0][3]-.1,
            rodTipWorldMatrix[1][3]-.1,
            rodTipWorldMatrix[2][3]-.1
        );

//find bait position in world space
        let end = vec3(
            bait.transform[0][3],
            bait.transform[1][3],
            bait.transform[2][3]
        );

//vector from start to end
        let dir = subtract(end, start);
        let length = magnitude(dir);

        let mid = mix(start, end, 0.5);

        let dirNorm = normalize(dir);

//calculate rotation to align fishing line with direction
        let up = vec3(0, 1, 0);
        let axis;
        let angle;


        //angle using dot product
            axis = cross(up, dirNorm);
            angle = Math.acos(dot(up, dirNorm)) * 180 / Math.PI;


        let lineTransform = mult(
            translate(mid[0], mid[1], mid[2]),
            mult(rotate(angle, axis),
                scalem(0.01, length / 2, 0.01))
        );

//apply transform to fishing line and draw
        fishingLine.transform = lineTransform;
        drawModel(fishingLine, gl.LINES);

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



//function to update arm model transforms
function updateArmIKToTarget(targetX, targetY) {
    inverseKinematics(targetX, targetY);
    forwardKinematics();

    //update upper arm transform
    upperArm.transform = mult(
        translate(-10.0, 8.0, 0.0),
        rotateZ(degrees(theta1))
    );


//update forearm
    forearm.transform = mult(
        translate(1.0, -1.0, 0.0),
        rotateZ(degrees(-theta2))
    );

    //update hand
    hand.transform = translate(0.0, 1.0, 0.0);
}

