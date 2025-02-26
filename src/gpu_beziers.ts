import { quat, vec2, vec3, vec4 } from "gl-matrix";
import { Object } from "./renderer";
import { Line, LineEnding, Polyline } from "./line";


export class QuadraticBezier {
    obj: Object;
    public a: vec2;
    public b: vec2;
    public c: vec2;

    constructor(a: vec2, b: vec2, c: vec2, colour: vec4) {
        this.obj = {
            triangles: [[0, 1, 2], [2, 3, 1]],
            vertices: [
                { vertex: vec3.create(), colour: colour, normal: vec3.create(), additional: {a: a, b: b, c: c} },
                { vertex: vec3.create(), colour: colour, normal: vec3.create(), additional: {a: a, b: b, c: c} },
                { vertex: vec3.create(), colour: colour, normal: vec3.create(), additional: {a: a, b: b, c: c} },
                { vertex: vec3.create(), colour: colour, normal: vec3.create(), additional: {a: a, b: b, c: c} }
            ],
            position: vec3.create(),
            rotation: quat.create(),
            scale: vec3.fromValues(1, 1, 1)
        };

        this.a = a;
        this.b = b;
        this.c = c;

        this.resizeVertices();
    }

    public resize(newValues: { a?: vec2, b?: vec2, c?: vec2 }) {
        if (newValues.a !== undefined) {
            this.a = newValues.a;
            this.obj.vertices.forEach(v => v.additional!.a = this.a);
        }
        if (newValues.b !== undefined) {
            this.b = newValues.b;
            this.obj.vertices.forEach(v => v.additional!.b = this.b);
        }
        if (newValues.c !== undefined) {
            this.c = newValues.c;
            this.obj.vertices.forEach(v => v.additional!.c = this.c);
        }

        this.resizeVertices();
    }

    resizeVertices() {
        const bounds = findBoundsOfPoints([this.a, this.b, this.c]);

        // top left
        this.obj.vertices[0].vertex[0] = bounds[0] - 50;
        this.obj.vertices[0].vertex[1] = bounds[1] - 50;
        
        // top right
        this.obj.vertices[1].vertex[0] = bounds[2] + 50;
        this.obj.vertices[1].vertex[1] = bounds[1] - 50;

        // bottom left
        this.obj.vertices[2].vertex[0] = bounds[0] - 50;
        this.obj.vertices[2].vertex[1] = bounds[3] + 50;
        
        // bottom right
        this.obj.vertices[3].vertex[0] = bounds[2] + 50;
        this.obj.vertices[3].vertex[1] = bounds[3] + 50;
    }
}

export class CubicBezier {
    quads: Object;
    circles: Object;
    public a: vec2;
    public b: vec2;
    public c: vec2;
    public d: vec2;
    colour: vec4;
    thickness: number;
    line: Polyline;

    constructor(a: vec2, b: vec2, c: vec2, d: vec2, colour: vec4, thickness: number) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        
        this.quads = {
            triangles: [],
            vertices: [],
            position: vec3.create(),
            rotation: quat.create(),
            scale: vec3.fromValues(1, 1, 1)
        };
        
        this.circles = {
            triangles: [],
            vertices: [],
            position: vec3.create(),
            rotation: quat.create(),
            scale: vec3.fromValues(1, 1, 1)
        };

        this.colour = colour;
        this.thickness = thickness;
        this.line = new Polyline([[0,0], [0,0]], LineEnding.ROUND, colour, thickness);

        this.refreshApproximation();
    }

    public resize(newValues: { a?: vec2, b?: vec2, c?: vec2, d?: vec2 }) {
        if (newValues.a !== undefined) {
            this.a = newValues.a;
        }
        if (newValues.b !== undefined) {
            this.b = newValues.b;
        }
        if (newValues.c !== undefined) {
            this.c = newValues.c;
        }
        if (newValues.d !== undefined) {
            this.d = newValues.d;
        }

        this.refreshApproximation();
    }

    refreshApproximation() {
        const points = segmentizeWithDeCasteljau({a: this.a, b: this.b, c: this.c, d: this.d}, 0.1);

        this.line.resize(points);
        this.quads = this.line.quads;
        this.circles = this.line.circles;
    }
}

interface DeCastStep {
    a: vec2,
    b: vec2,
    c: vec2,
    d: vec2
}

function segmentizeWithDeCasteljau(start: DeCastStep, flatness: number) {
    const points = [];
    const stack = [start];
    
    while(stack.length > 0) {
        const bezier = stack.pop()!;

        const ab = lerp(bezier.a, bezier.b, 0.5);
        const bc = lerp(bezier.b, bezier.c, 0.5);
        const cd = lerp(bezier.c, bezier.d, 0.5);
        const abbc = lerp(ab, bc, 0.5);
        const bccd = lerp(bc, cd, 0.5);
        const abbccd = lerp(abbc, bccd, 0.5);

        const sub1 = {a: bezier.a, b: ab, c: abbc, d: abbccd};
        const sub1LineLength = vec2.dist(sub1.a, sub1.d);

        if(approxLength(sub1) - sub1LineLength > flatness)
            stack.push(sub1);
        else {
            points.push(sub1.a);
            points.push(sub1.d);
        }

        const sub2 = {a: abbccd, b: bccd, c: cd, d: bezier.d};
        const sub2LineLength = vec2.dist(sub2.a, sub2.d);

        if(approxLength(sub2) - sub2LineLength > flatness)
            stack.push(sub2);
        else {
            points.push(sub2.a);
            points.push(sub2.d);
        }
    }

    return points;
}

function lerp(p1: vec2, p2: vec2, t: number) {
    return vec2.fromValues(
        (1-t)*p1[0] + p2[0]*t,
        (1-t)*p1[1] + p2[1]*t,
    );
}

function approxLength(bezier: DeCastStep) {
    return vec2.dist(bezier.a, bezier.b) +
        vec2.dist(bezier.b, bezier.c) +
        vec2.dist(bezier.c, bezier.d);
}

function cubicCoefficients(a: vec2, b: vec2, c: vec2, d: vec2) {
    return [
        d[0] - 3.0*c[0] + 3.0*b[0] - a[0],
        3.0*c[0] - 6.0*b[0] + 3.0*a[0],
        3.0*b[0] - 3.0*a[0],
        a[0],
        d[1] - 3.0*c[1] + 3.0*b[1] - a[1],
        3.0*c[1] - 6.0*b[1] + 3.0*a[1],
        3.0*b[1] - 3.0*a[1],
        a[1]
    ];
}

function pointOnCubic(t: number, coeffs: number[]): vec2 {
    const t2 = t*t;
    const t3 = t2*t;

    return [
        coeffs[0]*t3 + coeffs[1]*t2 + coeffs[2]*t + coeffs[3],
        coeffs[4]*t3 + coeffs[5]*t2 + coeffs[6]*t + coeffs[7]
    ];
}

function findBoundsOfPoints(points: vec2[]) {
    let minX = points[0][0], maxX = points[0][0], minY = points[0][1], maxY = points[0][1];

    points.forEach(p => {
        if(p[0] < minX)
            minX = p[0];
        else if(p[0] > maxX)
            maxX = p[0];
        if(p[1] < minY)
            minY = p[1];
        else if(p[1] > maxY)
            maxY = p[1];
    })

    return [minX, minY, maxX, maxY]
}