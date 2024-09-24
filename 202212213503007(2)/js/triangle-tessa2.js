"use strict"; 
const { vec3 } = glMatrix; 
var canvas; 
var gl; 
var points = []; 

/** Parameters */ 
var numTimesToSubdivide = 3; 
var theta = 60; 
var twist = false; 
var radius = 1.0; 
var angle = 0; // 旋转角度

window.onload = function initTriangles() { 
    canvas = document.getElementById("gl-canvas"); 
    gl = canvas.getContext("webgl2"); 
    if (!gl) { 
        alert("WebGL isn't available"); 
    } 

    // 初始化数据
    initializeData();

    // 添加滑块的事件监听器
    const slider = document.getElementById("subdivisionLevel");
    const levelDisplay = document.getElementById("levelDisplay");
    slider.oninput = function() {
        numTimesToSubdivide = parseInt(this.value);
        levelDisplay.textContent = numTimesToSubdivide;
        initializeData(); // 重新初始化数据
    };

    // 添加旋转效果
    const rotationSlider = document.getElementById("rotationAngle");
    rotationSlider.oninput = function() {
        angle = parseFloat(this.value);
        initializeData(); // 重新初始化数据
    };
};

function initializeData() {
    points = []; // 清空点数组

    // 初始化 gasket 的角
    var vertices = [ 
        radius * Math.cos(90 * Math.PI / 180.0), radius * Math.sin(90 * Math.PI / 180.0), 0, 
        radius * Math.cos(210 * Math.PI / 180.0), radius * Math.sin(210 * Math.PI / 180.0), 0, 
        radius * Math.cos(-30 * Math.PI / 180.0), radius * Math.sin(-30 * Math.PI / 180.0), 0 
    ]; 

    var u = vec3.fromValues(vertices[0], vertices[1], vertices[2]); 
    var v = vec3.fromValues(vertices[3], vertices[4], vertices[5]); 
    var w = vec3.fromValues(vertices[6], vertices[7], vertices[8]); 

    divideTriangle(u, v, w, numTimesToSubdivide); 

    // configure webgl 
    gl.viewport(0, 0, canvas.width, canvas.height); 
    gl.clearColor(1.0, 1.0, 1.0, 1.0); 

    // load shaders and initialise attribute buffers 
    var program = initShaders(gl, "vertex-shader", "fragment-shader"); 
    gl.useProgram(program); 

    // load data into gpu 
    var vertexBuffer = gl.createBuffer(); 
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW); 

    // associate out shader variables with data buffer 
    var vPosition = gl.getAttribLocation(program, "vPosition"); 
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0); 
    gl.enableVertexAttribArray(vPosition); 

    renderTriangles(); 
}

function tessellaTriangle(a, b, c) { 
    var radian = theta * Math.PI / 180.0; 
    var angleRadian = angle * Math.PI / 180.0; // 将角度转为弧度
    var a_new = vec3.create(); 
    var b_new = vec3.create(); 
    var c_new = vec3.create(); 

    // 旋转坐标
    var rotate = (v) => {
        var x = v[0];
        var y = v[1];
        return vec3.fromValues(
            x * Math.cos(angleRadian) - y * Math.sin(angleRadian),
            x * Math.sin(angleRadian) + y * Math.cos(angleRadian),
            0
        );
    };

    a_new = rotate(a);
    b_new = rotate(b);
    c_new = rotate(c);

    points.push(a_new[0], a_new[1], a_new[2]); 
    points.push(b_new[0], b_new[1], b_new[2]); 
    points.push(b_new[0], b_new[1], b_new[2]); 
    points.push(c_new[0], c_new[1], c_new[2]); 
    points.push(c_new[0], c_new[1], c_new[2]); 
    points.push(a_new[0], a_new[1], a_new[2]);
} 

function divideTriangle(a, b, c, count) { 
    if (count == 0) { 
        tessellaTriangle(a, b, c); 
    } else { 
        var ab = vec3.create(); 
        vec3.lerp(ab, a, b, 0.5); 
        var bc = vec3.create(); 
        vec3.lerp(bc, b, c, 0.5); 
        var ca = vec3.create(); 
        vec3.lerp(ca, c, a, 0.5); 

        // 三个新三角形 
        divideTriangle(a, ab, ca, count - 1); 
        divideTriangle(ab, b, bc, count - 1); 
        divideTriangle(ca, bc, c, count - 1); 
        divideTriangle(ab, bc, ca, count - 1); 
    } 
} 

function renderTriangles() { 
    gl.clear(gl.COLOR_BUFFER_BIT); 
    gl.drawArrays(gl.LINES, 0, points.length / 3); 
}