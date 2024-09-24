"use strict";
const { vec3 } = glMatrix;
var canvas;
var gl;
var points = [];

/** Parameters */
var numTimesToSubdivide = 3;
var theta = 60;
var radius = 1.0;
var angle = 60; // 旋转角度

window.onload = function initTriangles() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL isn't available");
    }

    initializeData();

    // 添加滑块的事件
    const slider = document.getElementById("subdivisionLevel");
    const levelDisplay = document.getElementById("levelDisplay");
    slider.oninput = function() {
        numTimesToSubdivide = parseInt(this.value);
        levelDisplay.textContent = numTimesToSubdivide;
        initializeData(); // 重新初始化数据
    };

    const rotationSlider = document.getElementById("rotationAngle");
    rotationSlider.oninput = function() {
        angle = parseFloat(this.value);
        initializeData(); // 重新初始化数据
    };
};

function initializeData() {
    points = [];

    var vertices = [
        radius * Math.cos(90 * Math.PI / 180.0), radius * Math.sin(90 * Math.PI / 180.0), 0,
        radius * Math.cos(210 * Math.PI / 180.0), radius * Math.sin(210 * Math.PI / 180.0), 0,
        radius * Math.cos(-30 * Math.PI / 180.0), radius * Math.sin(-30 * Math.PI / 180.0), 0
    ];

    var u = vec3.fromValues(vertices[0], vertices[1], vertices[2]);
    var v = vec3.fromValues(vertices[3], vertices[4], vertices[5]);
    var w = vec3.fromValues(vertices[6], vertices[7], vertices[8]);

    divideTriangle(u, v, w, numTimesToSubdivide);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    renderTriangles();
}

function tessellaTriangle(a, b, c) {
    var radian = theta * Math.PI / 180.0;

    var rotate = (v) => {
        var x = v[0];
        var y = v[1];
        var d = Math.sqrt(x * x + y * y); // 计算距离
        var angleToApply = d * angle * Math.PI / 180.0; // 根据距离设置旋转角度

        return vec3.fromValues(
            x * Math.cos(angleToApply) - y * Math.sin(angleToApply),
            x * Math.sin(angleToApply) + y * Math.cos(angleToApply),
            0
        );
    };

    var a_new = rotate(a);
    var b_new = rotate(b);
    var c_new = rotate(c);

    points.push(a_new[0], a_new[1], a_new[2]);
    points.push(b_new[0], b_new[1], b_new[2]);
    points.push(b_new[0], b_new[1], b_new[2]);
    points.push(c_new[0], c_new[1], c_new[2]);
    points.push(c_new[0], c_new[1], c_new[2]);
    points.push(a_new[0], a_new[1], a_new[2]);
}

function divideTriangle(a, b, c, count) {
    if (count === 0) {
        tessellaTriangle(a, b, c);
    } else {
        var ab = vec3.create();
        vec3.lerp(ab, a, b, 0.5);
        var bc = vec3.create();
        vec3.lerp(bc, b, c, 0.5);
        var ca = vec3.create();
        vec3.lerp(ca, c, a, 0.5);

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
