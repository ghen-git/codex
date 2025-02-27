import './style.css';
import { stringToHTML } from './modules/util';
import { DrawCall, init } from './renderer';
import { vertexShader as lineQuadsVertex } from './shaders/2d_flat_quads/vertex';
import { fragmentShader as lineQuadsFragment } from './shaders/2d_flat_quads/fragment';
import { vertexShader as lineCirclesVertex } from './shaders/2d_flat_circles/vertex';
import { fragmentShader as lineCirclesFragment } from './shaders/2d_flat_circles/fragment';
import { rgbToScreenSpace } from './math_ops';
import * as FlatCircles from './flat_circles'
import { mat4, vec2, vec4 } from 'gl-matrix';
import { CubicBezier } from './gpu_beziers';

let canvas: HTMLCanvasElement;

document.addEventListener('DOMContentLoaded', () => {
    canvas = stringToHTML(`<canvas></canvas>`) as HTMLCanvasElement;
    document.body.appendChild(canvas);
    resizeCanvas();

    setupDrawCalls();
    setupRenderer();
});

let flatQuadsDrawCall: DrawCall;
let flatCirclesDrawCall: DrawCall;

function setupDrawCalls() {
    flatQuadsDrawCall = new DrawCall(window, {
        backgroundColour: rgbToScreenSpace(17, 17, 17),
        vertexShaderSource: lineQuadsVertex,
        fragmentShaderSource: lineQuadsFragment,
        projectionMatrix: createProjectionMatrix2d(),
    });

    flatCirclesDrawCall = new DrawCall(window, {
        backgroundColour: rgbToScreenSpace(17, 17, 17),
        vertexShaderSource: lineCirclesVertex,
        fragmentShaderSource: lineCirclesFragment,
        projectionMatrix: createProjectionMatrix2d(),
        additionalShaderData: {
            initBuffers: FlatCircles.initAdditionalBuffers,
            writeToBuffers: FlatCircles.writeToAdditionalBuffers
        }
    });
}

function setupRenderer() {
    const renderer = init(canvas, window, rgbToScreenSpace(17, 17, 17), [
        flatQuadsDrawCall,
        flatCirclesDrawCall
    ])!;

    renderer.start();
}

let clicks: vec2[] = [];

window.addEventListener('click', e => {

    if(clicks.length < 3) {
        clicks.push([e.clientX, e.clientY]);
        return;
    }
    clicks.push([e.clientX, e.clientY]);

    const bezier = new CubicBezier(
        clicks[0],
        clicks[1],
        clicks[2],
        clicks[3],
        vec4.fromValues(1, 1, 1, 1),
        60
    );

    clicks = [];

    flatQuadsDrawCall.addObject(bezier.quads);
    flatCirclesDrawCall.addObject(bezier.circles);
    
    // setTimeout(() => {
    //     flatQuadsDrawCall.removeObject(bezier.quads);
    //     flatCirclesDrawCall.removeObject(bezier.circles);
    // }, 5000);
})

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function createProjectionMatrix2d() {
    return mat4.fromValues(
        2 / window.innerWidth, 0, 0, 0,
        0, -2 / window.innerHeight, 0, 0,
        0, 0, 1, 0,
        -1, 1, 0, 1
    );
}