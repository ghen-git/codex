import { quat, vec2, vec3, vec4 } from "gl-matrix";
import { Object } from "./renderer";


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
    obj: Object;
    public a: vec2;
    public b: vec2;
    public c: vec2;
    public d: vec2;
    colour: vec4;

    constructor(a: vec2, b: vec2, c: vec2, d: vec2, colour: vec4) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        
        this.obj = {
            triangles: [],
            vertices: [],
            position: vec3.create(),
            rotation: quat.create(),
            scale: vec3.fromValues(1, 1, 1)
        };

        this.colour = colour;

        this.refreshApproximation();
    }

    public resize(newValues: { a?: vec2, b?: vec2, c?: vec2, d?: vec2 }) {
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
        if (newValues.d !== undefined) {
            this.d = newValues.d;
            this.obj.vertices.forEach(v => v.additional!.d = this.d);
        }

        this.refreshApproximation();
    }

    buildQuads(nQuads: number) {
        for(let i = 0; i < nQuads; i++) {
            const quadI = i * 4;

            this.obj.triangles.push(
                [quadI, quadI + 1, quadI + 2],
                [quadI + 2, quadI + 3, quadI + 1]
            );

            this.obj.vertices.push(
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: {a: this.a, b: this.b, c: this.c, d: this.d} },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: {a: this.a, b: this.b, c: this.c, d: this.d} },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: {a: this.a, b: this.b, c: this.c, d: this.d} },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: {a: this.a, b: this.b, c: this.c, d: this.d} }
            );
        }
    }

    approxLength(coeffs: number[], accurancy: number) {
        const stepSize = 1 / accurancy;

        let prevPoint: vec2 = this.a;
        let currPoint: vec2;
        let length = 0;
        let distX, distY;

        for(let t = 0; t < 1; t += stepSize) {
            currPoint = pointOnCubic(t, coeffs);

            distX = currPoint[0] - prevPoint[0];
            distY = currPoint[1] - prevPoint[1];
            length += distX*distX + distY*distY;

            prevPoint = currPoint;
        }

        return Math.sqrt(length);
    }

    cachedSteps: number = 0;

    refreshApproximation() {
        const coeffs = cubicCoefficients(this.a, this.b, this.c, this.d);
        const length = this.approxLength(coeffs, 5);
        const steps = Math.ceil(length / 100) * 8;

        if(this.cachedSteps != steps) {
            this.obj.triangles = [];
            this.obj.vertices = [];

            this.buildQuads(steps);
            this.cachedSteps = steps;
        }

        const thickness = 3;

        let prevPoint: vec2 = this.a;
        let currPoint: vec2;
        let tStep = 1 / steps;
        let quadIndex = 0;

        for(let t = tStep; quadIndex < steps * 4; t += tStep) {
            currPoint = pointOnCubic(t, coeffs);
            if(quadIndex == 29)
                currPoint = this.d;

            const quadNormal = vec2.fromValues(-(currPoint[1] - prevPoint[1]), currPoint[0] - prevPoint[0]);
            vec2.normalize(quadNormal, quadNormal);
            vec2.scale(quadNormal, quadNormal, thickness);

            // top left
            this.obj.vertices[quadIndex].vertex[0] = prevPoint[0] + quadNormal[0];
            this.obj.vertices[quadIndex].vertex[1] = prevPoint[1] + quadNormal[1];
            
            // top right
            this.obj.vertices[quadIndex + 1].vertex[0] = currPoint[0] + quadNormal[0];
            this.obj.vertices[quadIndex + 1].vertex[1] = currPoint[1] + quadNormal[1];

            // bottom left
            this.obj.vertices[quadIndex + 2].vertex[0] = prevPoint[0] - quadNormal[0];
            this.obj.vertices[quadIndex + 2].vertex[1] = prevPoint[1] - quadNormal[1];
            
            // bottom right
            this.obj.vertices[quadIndex + 3].vertex[0] = currPoint[0] - quadNormal[0];
            this.obj.vertices[quadIndex + 3].vertex[1] = currPoint[1] - quadNormal[1];

            quadIndex += 4;
            prevPoint = currPoint;
        }
    }
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