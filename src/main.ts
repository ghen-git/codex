import './style.css';
import { stringToHTML } from './modules/util';
import { vec2, vec4 } from 'gl-matrix';
import { setupRenderer } from './codex/rendering/renderer_setup';
import { CubicBezier } from './codex/beziers';
import { lerp, lerpVec2, rand, randInt, vecFrom2Points } from './math_ops';
import { Line, LineEnding } from './codex/lines';
import { BezierPath } from './codex/paths';
import { Animator } from './codex/animation';
import { lineAnimation } from './codex/animations/line_animation';
import { LinkedList } from './codex/linked_list';
import { ClothSim, Point, Seam } from './codex/animations/cloth_sim';

let canvas: HTMLCanvasElement;
let animator: Animator;

document.addEventListener('DOMContentLoaded', () => {
    canvas = stringToHTML(`<canvas></canvas>`) as HTMLCanvasElement;
    document.body.appendChild(canvas);
    resizeCanvas();
    setupRenderer(canvas);

    for(let i = 0; i < 10; i++)
        new CubicBezier(
            [randInt(0, window.innerWidth), randInt(0, window.innerHeight)],
            [randInt(0, window.innerWidth), randInt(0, window.innerHeight)],
            [randInt(0, window.innerWidth), randInt(0, window.innerHeight)],
            [randInt(0, window.innerWidth), randInt(0, window.innerHeight)],
            [rand(0, 1), rand(0, 1), rand(0, 1), 1],
            32,
            LineEnding.ROUND
        );

    animator = new Animator();
    animator.start()
    requestAnimationFrame(stepAnimations);
});

let clothSim: ClothSim | undefined;
let prevFrameTime: number;
let lastSpline: BezierPath | undefined;

function stepAnimations() {
    requestAnimationFrame(stepAnimations);

    const time = Date.now();
    const deltaTime = time - prevFrameTime;
    prevFrameTime = time;

    if (clothSim) {
        clothSim.simulationFrame(deltaTime);
        const points = clothSim.points.map(p => p.pos);

        if (lastSpline) {
            lastSpline.remove();
            lastSpline = undefined;
        }

        const spline = cardinalSpline(points);

        lastSpline = spline;
    }
}


let mousePos: Point = new Point([0, 0], true);
window.addEventListener('mousemove', e => {
    mousePos.pos = [e.clientX, e.clientY];
})

const startPos: vec2 = [0, 0];
const nPoints = 10;

window.addEventListener('click', e => {
    const points: Point[] = [mousePos];
    const seams: Seam[] = [];

    for (let i = 1; i < nPoints; i++) {
        const t = i / nPoints;
        const pointPos = lerpVec2(mousePos.pos, startPos, t);
        points.push(new Point(pointPos, false));
        seams.push(new Seam(points[i - 1], points[i]));
    }

    clothSim = new ClothSim(points, seams);
});

const lineTLength = 1;
let animSteps = 7;

interface Animation {
    stepFunction: (anim: Animation) => void;
    progress: number;
    spline: BezierPath;
}

const animations: Animation[] = [];


function cardinalSpline(points: vec2[]) {
    const first = points[0];
    const second = points[1];
    const secondToLast = points[points.length - 2];
    const last = points[points.length - 1];

    const expandedFirst = vec2.add(vec2.create(), first, vecFrom2Points(second, first));
    const expandedLast = vec2.add(vec2.create(), last, vecFrom2Points(secondToLast, last));

    points = [expandedFirst, ...points, expandedLast];
    const velocities: vec2[] = [];
    const path = new BezierPath(vec4.fromValues(1, 1, 1, 1), 2, LineEnding.ROUND);
    path.endT = points.length;

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

    path.addBezier(startPos, b, c, endPos, 0, 1);
}

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}