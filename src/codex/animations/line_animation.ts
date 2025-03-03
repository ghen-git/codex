import { vec2, vec4 } from "gl-matrix";
import { Animation, Animator } from "../animation";
import { lerp } from "../../math_ops";
import { Line, LineEnding } from "../lines";

interface LineAnimationData {
    line: Line,
    getEndPos: () => vec2
};

export function lineAnimation(a: vec2, getEndPos: () => vec2, millisDuration: number, animator: Animator) {
    const animation = new Animation<LineAnimationData>(
        millisDuration,
        frame,
        () => setup(a, getEndPos),
        cleanup,
        animator
    );

    return animation;
}

function frame(t: number, data?: LineAnimationData) {
    const longerT = lerp(0, 1.2, t);

    const stepStart = Math.max(0, longerT - 0.2)
    const stepEnd = Math.min(1, longerT);
    data!.line.setTBounds(stepStart, stepEnd);
    data!.line.b = data!.getEndPos();
}

function setup(a: vec2, getEndPos: () => vec2) {
    return {
        line: new Line(a, getEndPos(), LineEnding.ROUND, vec4.fromValues(1, 1, 1, 1), 4, 0, 0),
        getEndPos: getEndPos
    };
}

function cleanup(data?: LineAnimationData) {
    console.log
    data!.line.remove();
}