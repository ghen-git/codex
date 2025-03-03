import './style.css';
import { stringToHTML } from './modules/util';
import { vec2, vec4 } from 'gl-matrix';
import { setupRenderer } from './codex/rendering/renderer_setup';
import { CubicBezier } from './codex/beziers';
import { rand, randInt, vecFrom2Points } from './math_ops';
import { Line, LineEnding } from './codex/lines';
import { BezierPath } from './codex/paths';
import { Animator } from './codex/animation';
import { lineAnimation } from './codex/animations/line_animation';
import { LinkedList } from './codex/linked_list';

let canvas: HTMLCanvasElement;
let animator: Animator;

document.addEventListener('DOMContentLoaded', () => {
    canvas = stringToHTML(`<canvas></canvas>`) as HTMLCanvasElement;
    document.body.appendChild(canvas);
    resizeCanvas();
    setupRenderer(canvas);

    animator = new Animator();
    animator.start();

    // const points: vec2[] = [[100, 0], [100, 100], [200, 200], [300, 200], [400, 150], [500, 0], [600, 300], [600, 400]];

    // const startLine = new Line(points[0], points[1], LineEnding.ROUND, vec4.fromValues(1, 1, 1, 1), 1);
    // const endLine = new Line(points[2], points[3], LineEnding.ROUND, vec4.fromValues(1, 1, 1, 1), 1);
    // const bezier = new CubicBezier(points[4], points[5], points[6], points[7], vec4.fromValues(1, 1, 1, 1), 1, LineEnding.ROUND);
    // const spline = cardinalSpline([points[0],points[0], points[1],  points[1], points[2], points[2], points[3], points[3], points[4], points[5]]);

    // animations.push({
    //     stepFunction: (anim: Animation) => {
    //         const animationStateEnd = (anim.progress + lineTLength) % 9;
    //         anim.spline.setTBounds(anim.progress, animationStateEnd);
    //         // anim.spline.endT = anim.progress;
    //     },
    //     progress: 0.0,
    //     spline: spline
    // });

    // requestAnimationFrame(stepAnimations);
});


let mousePos: vec2 = [0, 0];
window.addEventListener('mousemove', e => {
    mousePos[0] = e.clientX;
    mousePos[1] = e.clientY;
})

window.addEventListener('click', e => {
    lineAnimation([0,0], getMousePos, 1000, animator)
        .play();
});

function getMousePos() {
    return mousePos;
}

const step = 0.05;
const nBeziers = 11;
const lineTLength = 1;
const thickness = 1;
let animSteps = 7;

interface Animation {
    stepFunction: (anim: Animation) => void;
    progress: number;
    spline: BezierPath;
}

const animations: Animation[] = [];

function randomCardinalSpline() {
    const points: vec2[] = [];

    animations.push({
        stepFunction: (anim: Animation) => {
            const animationStateEnd = (anim.progress + lineTLength) % 11;
            // anim.spline.setTBounds(anim.progress, animationStateEnd);
            anim.spline.endT = anim.progress;
        },
        progress: 0.0,
        spline: cardinalSpline(points)
    });

    animSteps = 11;
}

function stepAnimations() {
    requestAnimationFrame(stepAnimations);

    animations.forEach(anim => {
        anim.stepFunction(anim);

        anim.progress += step;
        if (anim.progress > animSteps)
            anim.progress = 0;
    })
}

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

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}