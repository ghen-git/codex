import './style.css';
import { stringToHTML } from './modules/util';
import { DrawCall, init, Renderer } from './renderer';
import { vertexShader as quadVertex } from './shaders/2d_quad_beziers/vertex';
import { fragmentShader as quadFragment } from './shaders/2d_quad_beziers/fragment';
import { vertexShader as lineQuadsVertex } from './shaders/2d_flat_quads/vertex';
import { fragmentShader as lineQuadsFragment } from './shaders/2d_flat_quads/fragment';
import { vertexShader as lineCirclesVertex } from './shaders/2d_flat_circles/vertex';
import { fragmentShader as lineCirclesFragment } from './shaders/2d_flat_circles/fragment';
import { vertexShader as cubeVertex } from './shaders/3d_rendering/vertex';
import { fragmentShader as cubeFragment } from './shaders/3d_rendering/fragment';
import { axisAngleToQuat, quatMul, quatToAxisAngle, rand, randInt, rgbToScreenSpace, toRad } from './math_ops';
import { generateCubeObjects, moveCubesFrame } from './cubecode';
import { mat4, quat, vec2, vec3, vec4 } from 'gl-matrix';
import { CubicBezier, QuadraticBezier } from './gpu_beziers';

let canvas: HTMLCanvasElement;

//#region cubic beziers

interface ResizableBezier {
    bezier: CubicBezier
    resized: boolean
}
const lines: ResizableBezier[] = [];
const bezierOffset = 300;

document.addEventListener('DOMContentLoaded', () => {
    canvas = stringToHTML(`<canvas></canvas>`) as HTMLCanvasElement;
    document.body.appendChild(canvas);
    resizeCanvas();
    
    // renderer = initCubeRenderer();
    const drawCalls = initBezierRenderer();
    const renderer = init(canvas, window, rgbToScreenSpace(17, 17, 17), drawCalls)!;

    renderer.start();
});

function initBezierRenderer() {
    const quadsDrawCall = new DrawCall(window, {
        backgroundColour: rgbToScreenSpace(17, 17, 17),
        vertexShaderSource: lineQuadsVertex,
        fragmentShaderSource: lineQuadsFragment,
        frame: quadFrame,
        projectionMatrix: createProjectionMatrix2d(),
    });
    const circlesDrawCall = new DrawCall(window, {
        backgroundColour: rgbToScreenSpace(17, 17, 17),
        vertexShaderSource: lineCirclesVertex,
        fragmentShaderSource: lineCirclesFragment,
        frame: circleFrame,
        projectionMatrix: createProjectionMatrix2d(),
        additionalShaderData: {
            initBuffers: initAdditionalBuffers,
            writeToBuffers: writeToAdditionalBuffers
        }
    });

    for (let i = 0; i < 1; i++) {
        const startPos: vec2 = [randInt(0, window.innerWidth), randInt(0, window.innerHeight)];

        lines.push({
            bezier: new CubicBezier(
                vec2.add(vec2.create(), startPos, [0, 0]), 
                vec2.add(vec2.create(), startPos, [0, 0]),
                vec2.add(vec2.create(), startPos, [300, 300]),
                vec2.add(vec2.create(), startPos, [300, 300]), 
                rgbToScreenSpace(255, 255, 255), 30
            ),
            resized: false
        });

        quadsDrawCall.objects.push(lines[i].bezier.quads);
        circlesDrawCall.objects.push(lines[i].bezier.circles);
    }
    
    return [quadsDrawCall, circlesDrawCall];
}

function initCubeRenderer() {
    const cubesDrawCall = new DrawCall(window, {
        backgroundColour: rgbToScreenSpace(17, 17, 17),
        vertexShaderSource: cubeVertex,
        fragmentShaderSource: cubeFragment,
        frame: moveCubesFrame
    })!;    

    cubesDrawCall.objects = generateCubeObjects();
    return [cubesDrawCall];
}

function initAdditionalBuffers(drawCall: DrawCall, gl: WebGL2RenderingContext) {
    const uvBuffer = gl.createBuffer();

    const program = drawCall.renderingData!.program;
    drawCall.renderingData!.shaderAttrs.uvAttr = gl.getAttribLocation(program, "aUV");
    drawCall.renderingData!.uvBuffer = uvBuffer;
}

function writeToAdditionalBuffers(drawCall: DrawCall, gl: WebGL2RenderingContext) {
    const uvs: number[] = [];

    drawCall.objects.forEach(obj => obj.vertices.forEach(vertex => {
        uvs.push(...vertex.additional!.uv);
    }));

    const uvAttr = drawCall.renderingData!.shaderAttrs.uvAttr;
    const uvBuffer = drawCall.renderingData!.uvBuffer;

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(uvAttr);
}

function quadFrame(drawCall: DrawCall) {
    let updateBuffer = false;
    lines.forEach(line => {
        if (line.resized) {
            updateBuffer = true;
        }
    })

    if (updateBuffer)
        drawCall.writeObjectsToVertexBuffer();
}

function circleFrame(drawCall: DrawCall) {
    let updateBuffer = false;
    lines.forEach(line => {
        if (line.resized) {
            updateBuffer = true;
            line.resized = false;
        }
    })

    if (updateBuffer)
        drawCall.writeObjectsToVertexBuffer();
}

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
            else if (distance2dSq(line.bezier.d, [e.x, e.y]) < editLineVertexDistanceThreshold * editLineVertexDistanceThreshold) {
                selectedLine.line = line;
                selectedLine.index = 3;
                break;
            }
        }
    }
});

window.addEventListener('mousemove', e => {
    if (selectedLine.line !== undefined) {
        if (selectedLine.index == 0) // a
            selectedLine.line.bezier.resize({ a: [e.x, e.y] });
        else if (selectedLine.index == 1) // b
            selectedLine.line.bezier.resize({ b: [e.x, e.y] });
        else if (selectedLine.index == 2) // c
            selectedLine.line.bezier.resize({ c: [e.x, e.y] });
        else if (selectedLine.index == 3) // d
            selectedLine.line.bezier.resize({ d: [e.x, e.y] });

        selectedLine.line.resized = true;
    }
});

//#endregion

//#region quadratic beziers

// interface ResizableBezier {
//     bezier: QuadraticBezier
//     resized: boolean
// }
// const lines: ResizableBezier[] = [];

// document.addEventListener('DOMContentLoaded', () => {
//     canvas = stringToHTML(`<canvas></canvas>`) as HTMLCanvasElement;
//     document.body.appendChild(canvas);
//     resizeCanvas();

//     renderer = init(canvas, window, {
//         backgroundColour: rgbToScreenSpace(17, 17, 17),
//         vertexShaderSource: quadVertex,
//         fragmentShaderSource: quadFragment,
//         frame: frame,
//         projectionMatrix: createProjectionMatrix2d(),
//         additionalShaderData: {
//             initBuffers: initAdditionalBuffers,
//             writeToBuffers: writeToAdditionalBuffers
//         }
//     })!;

//     for(let i = 0; i < 100; i++) {
//         lines.push({
//             bezier: new QuadraticBezier([randInt(0, window.innerWidth), randInt(0, window.innerHeight)], [randInt(0, window.innerWidth), randInt(0, window.innerHeight)], [randInt(0, window.innerWidth), randInt(0, window.innerHeight)], rgbToScreenSpace(255, 255, 255)),
//             resized: false
//         });
//         renderer.objects.push(lines[i].bezier.obj);
//     }


//     renderer.start();
// });

// function initAdditionalBuffers(renderer: Renderer, gl: WebGL2RenderingContext) {
//     const aBuffer = gl.createBuffer();
//     const bBuffer = gl.createBuffer();
//     const cBuffer = gl.createBuffer();

//     const program = renderer.renderingData!.program;
//     renderer.renderingData!.shaderAttrs.aAttr = gl.getAttribLocation(program, "aA");
//     renderer.renderingData!.shaderAttrs.bAttr = gl.getAttribLocation(program, "aB");
//     renderer.renderingData!.shaderAttrs.cAttr = gl.getAttribLocation(program, "aC");
//     renderer.renderingData!.aBuffer = aBuffer;
//     renderer.renderingData!.bBuffer = bBuffer;
//     renderer.renderingData!.cBuffer = cBuffer;
// }

// function writeToAdditionalBuffers(renderer: Renderer, gl: WebGL2RenderingContext) {

//     const as: number[] = [], bs: number[] = [], cs: number[] = [];

//     renderer.objects.forEach(obj => obj.vertices.forEach(vertex => {
//         as.push(...vertex.additional!.a);
//         bs.push(...vertex.additional!.b);
//         cs.push(...vertex.additional!.c);
//     }));

//     const aAttr = renderer.renderingData!.shaderAttrs.aAttr;
//     const bAttr = renderer.renderingData!.shaderAttrs.bAttr;
//     const cAttr = renderer.renderingData!.shaderAttrs.cAttr;
//     const aBuffer = renderer.renderingData!.aBuffer;
//     const bBuffer = renderer.renderingData!.bBuffer;
//     const cBuffer = renderer.renderingData!.cBuffer;

//     gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(as), gl.STATIC_DRAW);
//     gl.vertexAttribPointer(aAttr, 2, gl.FLOAT, false, 0, 0);
//     gl.enableVertexAttribArray(aAttr);

//     gl.bindBuffer(gl.ARRAY_BUFFER, bBuffer);
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bs), gl.STATIC_DRAW);
//     gl.vertexAttribPointer(bAttr, 2, gl.FLOAT, false, 0, 0);
//     gl.enableVertexAttribArray(bAttr);

//     gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cs), gl.STATIC_DRAW);
//     gl.vertexAttribPointer(cAttr, 2, gl.FLOAT, false, 0, 0);
//     gl.enableVertexAttribArray(cAttr);
// }

// function frame() {
//     let updateBuffer = false;
//     lines.forEach(line => {
//         if (line.resized) {
//             updateBuffer = true;
//             line.resized = false;
//         }
//     })

//     if (updateBuffer)
//         renderer.writeObjectsToVertexBuffer();
// }

// window.addEventListener('mousedown', e => {
//     if (e.button == 0) {
//         mouseDown = true;
//         for (let i = 0; i < lines.length; i++) {
//             const line = lines[i];

//             if (distance2dSq(line.bezier.a, [e.x, e.y]) < editLineVertexDistanceThreshold * editLineVertexDistanceThreshold) {
//                 selectedLine.line = line;
//                 selectedLine.index = 0;
//                 break;
//             }
//             else if (distance2dSq(line.bezier.b, [e.x, e.y]) < editLineVertexDistanceThreshold * editLineVertexDistanceThreshold) {
//                 selectedLine.line = line;
//                 selectedLine.index = 1;
//                 break;
//             }
//             else if (distance2dSq(line.bezier.c, [e.x, e.y]) < editLineVertexDistanceThreshold * editLineVertexDistanceThreshold) {
//                 selectedLine.line = line;
//                 selectedLine.index = 2;
//                 break;
//             }
//         }
//     }
// });

// window.addEventListener('mousemove', e => {
//     if (selectedLine.line !== undefined) {
//         if (selectedLine.index == 0) // a
//             selectedLine.line.bezier.resize({ a: [e.x, e.y] });
//         else if (selectedLine.index == 1) // b
//             selectedLine.line.bezier.resize({ b: [e.x, e.y] });
//         else if (selectedLine.index == 2) // c
//             selectedLine.line.bezier.resize({ c: [e.x, e.y] });

//         selectedLine.line.resized = true;
//     }
// });

//#endregion

const editLineVertexDistanceThreshold = 100;
let mouseDown = false;

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


window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function distance2dSq(pos1: vec2, pos2: vec2) {
    const deltaPos = [pos2[0] - pos1[0], pos2[1] - pos1[1]];
    return deltaPos[0] * deltaPos[0] + deltaPos[1] * deltaPos[1]
}

function createProjectionMatrix2d() {
    return mat4.fromValues(
        2 / window.innerWidth, 0, 0, 0,
        0, -2 / window.innerHeight, 0, 0,
        0, 0, 1, 0,
        -1, 1, 0, 1
    );
}