import './style.css';
import { stringToHTML } from './modules/util';
import { init, Renderer } from './renderer';
import { vertexShader } from './shaders/2d_beziers/vertex';
import { fragmentShader } from './shaders/2d_beziers/fragment';
import { axisAngleToQuat, quatMul, quatToAxisAngle, rand, randInt, rgbToScreenSpace, toRad } from './math_ops';
import { cubeTriangles, cubeVertices, generateCubeObjects, moveCubesFrame } from './cubecode';
import { mat4, quat, vec2, vec3, vec4 } from 'gl-matrix';
import { QuadraticBezier } from './gpu_beziers';

let canvas: HTMLCanvasElement;
let renderer: Renderer;

interface ResizableBezier {
    bezier: QuadraticBezier
    resized: boolean
}
const lines: ResizableBezier[] = [];

function addRandomizedQuadraticBeziers() {
    // Ensure randInt is defined
    const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Create or select an SVG element
    let svg = document.querySelector('svg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '800'); // Set SVG width
        svg.setAttribute('height', '800'); // Set SVG height
        svg.setAttribute('style', 'border: 1px solid black; background: #f0f0f0;');
        document.body.appendChild(svg);
    }

    // Dimensions of the canvas
    const width = parseInt(svg.getAttribute('width') || '800', 10);
    const height = parseInt(svg.getAttribute('height') || '800', 10);

    // Add 1000 random quadratic Bézier curves
    for (let i = 0; i < 1000; i++) {
        const x1 = randInt(0, width);
        const y1 = randInt(0, height);
        const cx = randInt(0, width); // Control point
        const cy = randInt(0, height); // Control point
        const x2 = randInt(0, width);
        const y2 = randInt(0, height);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
        path.setAttribute('stroke', `rgb(${randInt(0, 255)}, ${randInt(0, 255)}, ${randInt(0, 255)})`);
        path.setAttribute('stroke-width', `${randInt(1, 5)}`);
        path.setAttribute('fill', 'none');
        svg.appendChild(path);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    canvas = stringToHTML(`<canvas></canvas>`) as HTMLCanvasElement;
    document.body.appendChild(canvas);
    resizeCanvas();

    renderer = init(canvas, window, {
        backgroundColour: rgbToScreenSpace(17, 17, 17),
        vertexShaderSource: vertexShader,
        fragmentShaderSource: fragmentShader,
        frame: frame,
        projectionMatrix: createProjectionMatrix2d(),
        additionalShaderData: {
            initBuffers: initAdditionalBuffers,
            writeToBuffers: writeToAdditionalBuffers
        }
    })!;

    for(let i = 0; i < 1; i++) {
        lines.push({
            bezier: new QuadraticBezier([randInt(0, window.innerWidth), randInt(0, window.innerHeight)], [randInt(0, window.innerWidth), randInt(0, window.innerHeight)], [randInt(0, window.innerWidth), randInt(0, window.innerHeight)], rgbToScreenSpace(255, 255, 255)),
            resized: false
        });
        renderer.objects.push(lines[i].bezier.obj);
    }


    renderer.start();
});

function initAdditionalBuffers(renderer: Renderer, gl: WebGL2RenderingContext) {
    const aBuffer = gl.createBuffer();
    const bBuffer = gl.createBuffer();
    const cBuffer = gl.createBuffer();

    const program = renderer.renderingData!.program;
    renderer.renderingData!.shaderAttrs.aAttr = gl.getAttribLocation(program, "aA");
    renderer.renderingData!.shaderAttrs.bAttr = gl.getAttribLocation(program, "aB");
    renderer.renderingData!.shaderAttrs.cAttr = gl.getAttribLocation(program, "aC");
    renderer.renderingData!.aBuffer = aBuffer;
    renderer.renderingData!.bBuffer = bBuffer;
    renderer.renderingData!.cBuffer = cBuffer;
}

function writeToAdditionalBuffers(renderer: Renderer, gl: WebGL2RenderingContext) {

    const as: number[] = [], bs: number[] = [], cs: number[] = [];

    renderer.objects.forEach(obj => obj.vertices.forEach(vertex => {
        as.push(...vertex.additional!.a);
        bs.push(...vertex.additional!.b);
        cs.push(...vertex.additional!.c);
    }));

    const aAttr = renderer.renderingData!.shaderAttrs.aAttr;
    const bAttr = renderer.renderingData!.shaderAttrs.bAttr;
    const cAttr = renderer.renderingData!.shaderAttrs.cAttr;
    const aBuffer = renderer.renderingData!.aBuffer;
    const bBuffer = renderer.renderingData!.bBuffer;
    const cBuffer = renderer.renderingData!.cBuffer;

    gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(as), gl.STATIC_DRAW);
    gl.vertexAttribPointer(aAttr, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aAttr);

    gl.bindBuffer(gl.ARRAY_BUFFER, bBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bs), gl.STATIC_DRAW);
    gl.vertexAttribPointer(bAttr, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(bAttr);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cs), gl.STATIC_DRAW);
    gl.vertexAttribPointer(cAttr, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cAttr);
}

function frame() {
    let updateBuffer = false;
    lines.forEach(line => {
        if (line.resized) {
            updateBuffer = true;
            line.resized = false;
        }
    })

    if (updateBuffer)
        renderer.writeObjectsToVertexBuffer();
}

function createProjectionMatrix2d() {
    return mat4.fromValues(
        2 / window.innerWidth, 0, 0, 0,
        0, -2 / window.innerHeight, 0, 0,
        0, 0, 1, 0,
        -1, 1, 0, 1
    );
}

const editLineVertexDistanceThreshold = 100;
let mouseDown = false;

window.addEventListener('mousedown', e => {
    if (e.button == 0) {
        mouseDown = true;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (distance2dSq(line.bezier.a, [e.x, e.y]) < editLineVertexDistanceThreshold * editLineVertexDistanceThreshold) {
                selectedLine.line = line;
                selectedLine.index = 0;
                break;
            }
            else if (distance2dSq(line.bezier.b, [e.x, e.y]) < editLineVertexDistanceThreshold * editLineVertexDistanceThreshold) {
                selectedLine.line = line;
                selectedLine.index = 1;
                break;
            }
            else if (distance2dSq(line.bezier.c, [e.x, e.y]) < editLineVertexDistanceThreshold * editLineVertexDistanceThreshold) {
                selectedLine.line = line;
                selectedLine.index = 2;
                break;
            }
        }
    }
});

window.addEventListener('mouseup', e => {
    if (e.button == 0) {
        mouseDown = false;
        selectedLine.line = undefined;
    }
});

const selectedLine: { line?: ResizableBezier, index: number } = {
    line: undefined,
    index: 0
}

window.addEventListener('mousemove', e => {
    if (selectedLine.line !== undefined) {
        if (selectedLine.index == 0) // a
            selectedLine.line.bezier.resize({ a: [e.x, e.y] });
        else if (selectedLine.index == 1) // b
            selectedLine.line.bezier.resize({ b: [e.x, e.y] });
        else if (selectedLine.index == 2) // c
            selectedLine.line.bezier.resize({ c: [e.x, e.y] });

        selectedLine.line.resized = true;
    }
});

function distance2dSq(pos1: vec2, pos2: vec2) {
    const deltaPos = [pos2[0] - pos1[0], pos2[1] - pos1[1]];
    return deltaPos[0] * deltaPos[0] + deltaPos[1] * deltaPos[1]
}

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}