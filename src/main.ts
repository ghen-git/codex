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

    animator = new Animator();
    animator.start()
    // const points: vec2[] = [[10, 0], [10, 100], [200, 200], [300, 200], [400, 150], [500, 0], [600, 3060, [600, 400]];
    // const startLine = new Line(points[0], points[1], LineEnding.ROUND, vec4.fromValues(1, 1, 1, 1), 1)80   // const endLine = new Line(points[2], points[3], LineEnding.ROUND, vec4.fromValues(1, 1, 1, 1), 1);
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

    requestAnimationFrame(stepAnimations);
});

let clothSim: ClothSim | undefined;
let spline: BezierPath;
let prevFrameTime: number;
let lastSpline: BezierPath | undefined;
let elapsed = 0;
let duration = 3000;

function stepAnimations() {
    requestAnimationFrame(stepAnimations);

    const time = Date.now();
    const deltaTime = time - prevFrameTime;
    prevFrameTime = time;

    if (clothSim) {
        clothSim.simulationFrame(deltaTime);
        // const points = clothSim.points.map(p => p.pos);

        // if (lastSpline) {
        //     lastSpline.remove();
        //     lastSpline = undefined;
        // }
        // if (elapsed < duration) {
        //     const tStep = elapsed / duration;
        //     const spline = cardinalSpline(points);

        //     spline.endT = lerp(points.length - 1, 0, tStep);
        //     spline.startT = Math.max(lerp(points.length - 1, 0, tStep) - 10, 0);

        //     lastSpline = spline;
        //     elapsed += deltaTime;
        // }
        // else {
        //     clothSim = undefined;
        //     lineAnimation(mousePos.pos, vec2.add(vec2.create(), mousePos.pos, vec2.fromValues(100, 0)), 250, animator)
        //         .onEnd.trigger(
        //             lineAnimation(vec2.add(vec2.create(), mousePos.pos, vec2.fromValues(100, 0)), vec2.add(vec2.create(), mousePos.pos, vec2.fromValues(100, 50)), 250, animator)
        //         )
        //         .play();
                
        //     lineAnimation(vec2.add(vec2.create(), mousePos.pos, vec2.fromValues(0, 0)), vec2.add(vec2.create(), mousePos.pos, vec2.fromValues(0, 50)), 250, animator)
        //     .onEnd.trigger(
        //         lineAnimation(vec2.add(vec2.create(), mousePos.pos, vec2.fromValues(0, 50)), vec2.add(vec2.create(), mousePos.pos, vec2.fromValues(100, 50)), 250, animator)
        //     ).play();
        // }
    }
}


let mousePos: Point = new Point([0, 0], true);
window.addEventListener('mousemove', e => {
    mousePos.pos = [e.clientX, e.clientY];
})

const startPos: vec2 = [0, 0];
const nPoints = 40;

window.addEventListener('click', e => {
    // lineAnimation([0,0], getMousePos, 1000, animator)
    //     .play();

    const points: Point[] = [mousePos];
    const seams: Seam[] = [];

    for(let i = 1; i < nPoints; i++) {
        const t = i / nPoints;
        const pointPos = lerpVec2(mousePos.pos, startPos, t);
        points.push(new Point(pointPos, false));
        seams.push(new Seam(points[i-1], points[i]));
    }

    elapsed = 0;
    clothSim = new ClothSim(points, seams);
});

function getMousePos() {
    return mousePos.pos;
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

    path.addBezier(startPos, b, c, endPos, 1, 1);
}

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}