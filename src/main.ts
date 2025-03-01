import './style.css';
import { stringToHTML } from './modules/util';
import { vec2, vec4 } from 'gl-matrix';
import { setupRenderer } from './codex/rendering/renderer_setup';
import { CubicBezier } from './codex/beziers';
import { normalize, vecFrom2Points } from './math_ops';
import { Line, LineEnding } from './codex/lines';

let canvas: HTMLCanvasElement;

document.addEventListener('DOMContentLoaded', () => {
    canvas = stringToHTML(`<canvas></canvas>`) as HTMLCanvasElement;
    document.body.appendChild(canvas);
    resizeCanvas();
    setupRenderer(canvas);

    requestAnimationFrame(stepAnimation);
});

const step = 0.01;
let animationState = 0.0;

function stepAnimation() {
    requestAnimationFrame(stepAnimation);

    if (spline.length <= 0)
        return;

    const animationStateEnd = (animationState + 1.0) % 10;
    const animStateStartI = Math.floor(animationState);
    const animStateEndI = Math.floor(animationStateEnd);
    const startBezier = spline[animStateStartI];
    const endBezier = spline[animStateEndI];

    startBezier.startT = animationState % 1;
    startBezier.endT = 1.0;
    endBezier.startT = 0.0;
    endBezier.endT = animationStateEnd % 1;

    animationState += step;
    if(animationState > 10)
        animationState = 0;
}

let clicks: vec2[] = [];
let spline: CubicBezier[] = [];

window.addEventListener('click', e => {
    if (clicks.length < 11) {
        clicks.push([e.clientX, e.clientY]);

        // if (clicks.length > 1)
        //     new Line(clicks[clicks.length - 2], clicks[clicks.length - 1], LineEnding.ROUND, vec4.fromValues(1, 0, 0, 1), 4);

        if (clicks.length < 11)
            return;
    }

    spline = cardinalSpline([...clicks]);

    clicks = [];
});

function cardinalSpline(points: vec2[]) {
    const first = points[0];
    const second = points[1];
    const secondToLast = points[points.length - 2];
    const last = points[points.length - 1];

    const expandedFirst = vec2.add(vec2.create(), first, vecFrom2Points(second, first));
    const expandedLast = vec2.add(vec2.create(), last, vecFrom2Points(secondToLast, last));

    points = [expandedFirst, ...points, expandedLast];
    const velocities: vec2[] = [];
    const spline = [];

    for (let i = 0; i < points.length - 1; i++) {
        if (i < points.length - 2)
            velocities.push(vec2.scale(vec2.create(), vecFrom2Points(points[i], points[i + 2]), 0.5));

        if (i >= 2)
            spline.push(hermiteSpline(points[i - 1], velocities[i - 2], points[i], velocities[i - 1]));
    }

    return spline;
}

function hermiteSpline(startPos: vec2, startVel: vec2, endPos: vec2, endVel: vec2) {
    const resizedStart = vec2.scale(vec2.create(), startVel, 1 / 3);
    const resizedEnd = vec2.scale(vec2.create(), endVel, -1 / 3);

    const b = vec2.add(vec2.create(), startPos, resizedStart);
    const c = vec2.add(vec2.create(), endPos, resizedEnd);

    const bezier = new CubicBezier(startPos, b, c, endPos, vec4.fromValues(1, 1, 1, 1), 16, LineEnding.ROUND);
    bezier.startT = 0.0;
    bezier.endT = 0.0;
    return bezier;
}

// window.addEventListener('mousemove', e => {
//     let multiplier = 1;

//     bezier.b = [e.clientX - 50, e.clientY*multiplier];
//     bezier.c = [e.clientX + 50, e.clientY*multiplier];
// })

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}