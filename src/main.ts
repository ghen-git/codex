import './style.css';
import { stringToHTML } from './modules/util';
import { vec2, vec4 } from 'gl-matrix';
import { setupRenderer } from './codex/rendering/renderer_setup';
import { CubicBezier } from './codex/beziers';
import { rand, randInt, vecFrom2Points } from './math_ops';
import { LineEnding } from './codex/lines';
import { BezierPath } from './codex/paths';

let canvas: HTMLCanvasElement;

document.addEventListener('DOMContentLoaded', () => {
    canvas = stringToHTML(`<canvas></canvas>`) as HTMLCanvasElement;
    document.body.appendChild(canvas);
    resizeCanvas();
    setupRenderer(canvas);

    for(let i = 0; i < 100; i++)
        randomCardinalSpline();

    requestAnimationFrame(stepAnimations);
});

const step = 0.02;
const nBeziers = 4;
const lineTLength = 0.1;
const thickness = 1;

interface Animation {
    stepFunction: (anim: Animation) => void;
    progress: number;
    spline: BezierPath;
}

const animations: Animation[] = [];

function randomCardinalSpline() {
    const points = [];

    for(let i = 0; i < nBeziers + 1; i++) {
        points.push(vec2.fromValues(randInt(0, window.innerWidth), randInt(0, window.innerHeight)));
    }
    points.push(points[0]);

    animations.push({
        stepFunction: (anim: Animation) => {
            const animationStateEnd = (anim.progress + lineTLength) % (nBeziers + 1);
            anim.spline.setTBounds(anim.progress, animationStateEnd);
        },
        progress: 0.0,
        spline: cardinalSpline(points)
    });
}

function stepAnimations() {
    requestAnimationFrame(stepAnimations);

    animations.forEach(anim => {
        anim.stepFunction(anim);

        anim.progress += step;
        if(anim.progress > nBeziers + 1)
            anim.progress = 0;
    })
}

let clicks: vec2[] = [];
let spline: BezierPath;

// window.addEventListener('click', e => {
//     if (clicks.length < 11) {
//         clicks.push([e.clientX, e.clientY]);

//         // if (clicks.length > 1)
//         //     new Line(clicks[clicks.length - 2], clicks[clicks.length - 1], LineEnding.ROUND, vec4.fromValues(1, 0, 0, 1), 4);

//         if (clicks.length < 11)
//             return;
//     }

//     spline = cardinalSpline([...clicks]);

//     clicks = [];
// });

function cardinalSpline(points: vec2[]) {
    const first = points[0];
    const second = points[1];
    const secondToLast = points[points.length - 2];
    const last = points[points.length - 1];

    const expandedFirst = vec2.add(vec2.create(), first, vecFrom2Points(second, first));
    const expandedLast = vec2.add(vec2.create(), last, vecFrom2Points(secondToLast, last));

    points = [expandedFirst, ...points, expandedLast];
    const velocities: vec2[] = [];
    const path = new BezierPath(vec4.fromValues(1, 1, 1, 1), thickness, LineEnding.ROUND);

    for (let i = 0; i < points.length - 1; i++) {
        if (i < points.length - 2)
            velocities.push(vec2.scale(vec2.create(), vecFrom2Points(points[i], points[i + 2]), 0.5));

        if (i >= 2)
            addHermiteSplineToPath(path, points[i - 1], velocities[i - 2], points[i], velocities[i - 1]);
    }

    return path;
}

function addHermiteSplineToPath(path: BezierPath, startPos: vec2, startVel: vec2, endPos: vec2, endVel: vec2) {
    const resizedStart = vec2.scale(vec2.create(), startVel, 1 / 3);
    const resizedEnd = vec2.scale(vec2.create(), endVel, -1 / 3);

    const b = vec2.add(vec2.create(), startPos, resizedStart);
    const c = vec2.add(vec2.create(), endPos, resizedEnd);

    path.addBezier(startPos, b, c, endPos);
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