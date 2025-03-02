import { vec2, vec4 } from "gl-matrix";
import { LineEnding, Polyline } from "./lines";
import { EPSILON, lerp } from "../math_ops";

export class CubicBezier {
    colour: vec4;
    thickness: number;
    line: Polyline;

    private _startT: number;
    public get startT(): number {
        return this._startT;
    }
    public set startT(value: number) {
        this._startT = value;
        this.refreshApproximation();
    }
    private _endT: number;
    public get endT(): number {
        return this._endT;
    }
    public set endT(value: number) {
        this._endT = value;
        this.refreshApproximation();
    }

    private approximationAccuracy = 0.01;
    private maxDeCasteljauDepth = 5;

    private _a: vec2;
    public get a(): vec2 {
        return this._a;
    }
    public set a(value: vec2) {
        this._a = value;
        this.refreshApproximation();
    }

    private _b: vec2;
    public get b(): vec2 {
        return this._b;
    }
    public set b(value: vec2) {
        this._b = value;
        this.refreshApproximation();
    }

    private _c: vec2;
    public get c(): vec2 {
        return this._c;
    }
    public set c(value: vec2) {
        this._c = value;
        this.refreshApproximation();
    }

    private _d: vec2;
    public get d(): vec2 {
        return this._d;
    }
    public set d(value: vec2) {
        this._d = value;
    }

    constructor(a: vec2, b: vec2, c: vec2, d: vec2, colour: vec4, thickness: number, ends: LineEnding) {
        this._a = a;
        this._b = b;
        this._c = c;
        this._d = d;

        this._startT = 0.0;
        this._endT = 1.0;

        this.colour = colour;
        this.thickness = thickness;
        this.line = new Polyline([[0, 0], [0, 0]], ends, colour, thickness);

        this.refreshApproximation();
    }

    refreshApproximation() {
        const segments = segmentizeWithDeCasteljau(
            { a: this._a, b: this._b, c: this._c, d: this._d },
            this.approximationAccuracy,
            this.maxDeCasteljauDepth, 0.0, 1.0
        );
        segments.push({ pos: this.d, t: 1 });

        let points: vec2[] = [];
        const selectedTs: number[] = [];

        segments.forEach(segment => {
            if (segment.t >= this._startT && segment.t <= this._endT) {
                points.push(segment.pos);
                selectedTs.push(segment.t);
            }
        })

        const coeffs = cubicCoefficients(this.a, this.b, this.c, this.d);

        if(Math.abs(selectedTs[0] - this._startT) > EPSILON || points.length == 0) {
            const newStart = pointOnCubic(this._startT, coeffs);
            points = [newStart, ...points];
        }
        
        if(Math.abs(selectedTs[selectedTs.length - 1] - this._endT) > EPSILON || points.length < 2) {
            const newEnd = pointOnCubic(this._endT, coeffs);
            points = [...points, newEnd];
        }
        
        this.line.changePoints(points);
    }
}

interface DeCastStep {
    a: vec2,
    b: vec2,
    c: vec2,
    d: vec2
}

interface SegmentizedPoint {
    pos: vec2,
    t: number
}

function segmentizeWithDeCasteljau(bezier: DeCastStep, flatness: number, depthBudget: number, leftT: number, rightT: number): SegmentizedPoint[] {
    if (depthBudget < 0)
        return [{ pos: bezier.a, t: leftT }];

    const lineLength = vec2.dist(bezier.a, bezier.d);
    if (approxLength(bezier) - lineLength <= flatness)
        return [{ pos: bezier.a, t: leftT }];

    const points: SegmentizedPoint[] = [];

    const ab = lerp(bezier.a, bezier.b, 0.5);
    const bc = lerp(bezier.b, bezier.c, 0.5);
    const cd = lerp(bezier.c, bezier.d, 0.5);
    const abbc = lerp(ab, bc, 0.5);
    const bccd = lerp(bc, cd, 0.5);
    const abbccd = lerp(abbc, bccd, 0.5);

    const sub1 = { a: bezier.a, b: ab, c: abbc, d: abbccd };
    const sub2 = { a: abbccd, b: bccd, c: cd, d: bezier.d };

    points.push(...segmentizeWithDeCasteljau(sub1, flatness, depthBudget - 1, leftT, leftT + (rightT - leftT) * 0.5));
    points.push(...segmentizeWithDeCasteljau(sub2, flatness, depthBudget - 1, leftT + (rightT - leftT) * 0.5, rightT));

    return points;
}

function approxLength(bezier: DeCastStep) {
    return vec2.dist(bezier.a, bezier.b) +
        vec2.dist(bezier.b, bezier.c) +
        vec2.dist(bezier.c, bezier.d);
}

export function cubicCoefficients(a: vec2, b: vec2, c: vec2, d: vec2) {
    return [
        d[0] - 3.0 * c[0] + 3.0 * b[0] - a[0],
        3.0 * c[0] - 6.0 * b[0] + 3.0 * a[0],
        3.0 * b[0] - 3.0 * a[0],
        a[0],
        d[1] - 3.0 * c[1] + 3.0 * b[1] - a[1],
        3.0 * c[1] - 6.0 * b[1] + 3.0 * a[1],
        3.0 * b[1] - 3.0 * a[1],
        a[1]
    ];
}

export function pointOnCubic(t: number, coeffs: number[]): vec2 {
    const t2 = t * t;
    const t3 = t2 * t;

    return [
        coeffs[0] * t3 + coeffs[1] * t2 + coeffs[2] * t + coeffs[3],
        coeffs[4] * t3 + coeffs[5] * t2 + coeffs[6] * t + coeffs[7]
    ];
}