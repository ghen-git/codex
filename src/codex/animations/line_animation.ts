import { vec2, vec4 } from "gl-matrix";
import { Animation, Animator } from "../animation";
import { lerp } from "../../math_ops";
import { Line, LineEnding } from "../lines";

interface LineAnimationData {
    line: Line
};

export function lineAnimation(a: vec2, b: vec2, millisDuration: number, animator: Animator) {
    const animation = new Animation<LineAnimationData>(
        millisDuration,
        frame,
        () => setup(a, b),
        cleanup,
        animator
    );

    return animation;
}

function frame(t: number, data?: LineAnimationData) {
    const longerT = lerp(0, 1.2, t);

    const stepStart = 0;
    const stepEnd = Math.min(1, longerT);
    data!.line.setTBounds(stepStart, stepEnd);
}

function setup(a: vec2, b: vec2) {
    return {
        line: new Line(a, b, LineEnding.ROUND, vec4.fromValues(1, 1, 1, 1), 2, 0, 0)
    };
}

function cleanup(data?: LineAnimationData) {
    // data!.line.remove();
}