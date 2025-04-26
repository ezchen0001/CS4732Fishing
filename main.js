/*
    CS 4732 - Project 1 
    @author Ethan Chen
*/


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

    // Retrieve <form> element and connect the file input event
    let input = document.getElementById("files");

    // Use file reader when user uploads SVG file
    let reader;
    input.addEventListener("input", function(e){
        if (e.target.files.length === 0) return; // skip if no file found
        reader = readTextFile(e);
        reader.addEventListener("load", onFileLoad);
    });

    let reset = true
    let splines = [];
    let activeSpline = null;
    let splineModels = []
    function onFileLoad(e){
        // Initialize animation time state
        reset = true
        // Parse file as spline for gl buffers and viewports
        let raw_lines = reader.result.split("\n");
        let lines = [];
        
        for (let i = 0; i < raw_lines.length; i++){
            let line = raw_lines[i].trim();
            if (line.length == 0 || line[0] == "#")
                continue;
            lines.push(line);
        }
        // Get spline count
        let splineCount = parseInt(lines.shift())
        for (let spline_i = 0; spline_i < splineCount; spline_i++){
            // Get point count / time info
            let pointCount = parseInt(lines.shift());
            let timeCount = Number(lines.shift());
            let posPoints = [];
            let rotPoints = [];
            // Get point data
            for (let i = 0; i < pointCount*2; i++){
                let raw_dat = lines[i]
                let nums = raw_dat.replaceAll(' ', '').split(",")
                for (let j = 0; j < nums.length; j++){
                    nums[j] = Number(nums[j]);
                }
                if (i%2 ==0){
                    nums.push(1.0)
                    posPoints.push(nums);
                }else{
                    rotPoints.push(eulerToQuat(nums[0],nums[1],nums[2]));
                }
            }
            splines.push(new Spline(timeCount, posPoints, rotPoints));
        }
        
        // Setup scene
        activeSpline = splines[0];
        splineModels = []
        for (let i = 0; i < activeSpline.posPoints.length; i++){
            singleColorCube(7)
            let model = new Model(gl)
            model.setData(gl, pointsArray, colorsArray)
            let pos = activeSpline.posPoints[i]
            model.transform = mult(translate(pos[0], pos[1], pos[2]), scalem(0.5,0.5,0.5))
            splineModels.push(model)
        }
    }


	// Define camera settings
	let cameraProjection = perspective(90,canvas.width/canvas.height,.1, 100);
    let cameraPos = vec3(0,7.5,5)
	let cameraTarget = vec3(0,5,0)

    // Define model
    let modelRoot = new Model(gl)

    let modelLegs = [ // Upper leg, lower leg, foot
        [new Model(gl), new Model(gl), new Model(gl)],
        [new Model(gl), new Model(gl), new Model(gl)]
    ]

    // Create model geometry
    colorCube()
    modelRoot.setData(gl, pointsArray, colorsArray)
    for (let legIndex = 0; legIndex < modelLegs.length; legIndex++){
        let legArr = modelLegs[legIndex]
        for (let i = 0; i < legArr.length; i++){
            if (i == 0){
                legArr[i].setParent(modelRoot)
            }else{
                legArr[i].setParent(legArr[i-1])
            }
            colorCube()
            multCube(mult(scalem(0.3,1,0.3),translate(0,-1,0)))
            if (i == 2){
                multCube(scalem(1,0.5,1))
                multCube(rotateX(90))
            }
            legArr[i].setData(gl, pointsArray, colorsArray)
        }

        // Pose the initial model transformations
        let hOffset = legIndex == 0 ? 0.5 : -0.5
        legArr[0].transform = translate(hOffset,-1,0)
        legArr[1].transform = translate(0,-2,0)
        legArr[2].transform = translate(0,-2,0)
    }
    modelRoot.transform = rotateY(45)

    let elapsedTime = 0
    let distTravelled = 0
    let lastTime = 0
    let lookAtTransform = mat4()
    function render(currTime){
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
        gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw root
        drawModel(modelRoot, gl.TRIANGLES);

        // Draw legs
        for(let i = 0; i < 3; i++){
            drawModel(modelLegs[0][i], gl.TRIANGLES);
            drawModel(modelLegs[1][i], gl.TRIANGLES);
        }

        // Break if no spline is active
        if (activeSpline == null){
            requestAnimationFrame(render);
            return;
        }

        // Advance time
        let delta = (currTime - lastTime)/1000
        let splinePos = findCatmullRomPoint(activeSpline.posPoints, (elapsedTime+delta)/activeSpline.time)
        let splinePos2 = findCatmullRomPoint(activeSpline.posPoints, (elapsedTime)/activeSpline.time)
        let splineRot = findQuatRotPoint(activeSpline.rotPoints,(elapsedTime)/activeSpline.time)


        // Accumulate distance travelled
        distTravelled += magnitude(subtract(splinePos2, splinePos))

        
        
		// Loop animation
        elapsedTime += delta
        if (elapsedTime > activeSpline.time){
			elapsedTime = 0
		}
        
        // Animate root
        let timeTheta = distTravelled*4
        
        
        if (!equal(cross(vec3(splinePos2),vec3(splinePos)), vec3())){ // Handle edge case when cross vector becomes zero
            lookAtTransform = inverse(lookAt(vec3(splinePos2), vec3(splinePos), vec3(0, 1, 0)))
        }
        modelRoot.transform = mult(quatToMatrix(splineRot), translate(0,5,0))
        modelRoot.transform = mult(lookAtTransform, modelRoot.transform)
        // Animate legs
        for (let legIndex = 0; legIndex < modelLegs.length; legIndex++){
            let legArr = modelLegs[legIndex]
            let hOffset = legIndex == 0 ? 0.5 : -0.5
            let timeOffset = legIndex == 0 ? 0 : Math.PI
            let rotRad = timeTheta + timeOffset
            legArr[0].transform = mult(translate(hOffset,-1,0), rotateX(Math.cos(rotRad)*45))
            legArr[1].transform = mult(translate(0,-2,0), rotateX(Math.sin(rotRad)*45-45))
            legArr[2].transform = mult(translate(0,-2,0), rotateX(-Math.cos(rotRad)*45))
        }
        
        for(let i = 0; i < splineModels.length; i++){
            drawModel(splineModels[i], gl.LINES);
        }
		
        lastTime = currTime
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


}
