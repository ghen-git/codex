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

    constructor(a: vec2, b: vec2, c: vec2, d: vec2, colour: vec4) {
        this.obj = {
            triangles: [[0, 1, 2], [2, 3, 1]],
            vertices: [
                { vertex: vec3.create(), colour: colour, normal: vec3.create(), additional: {a: a, b: b, c: c, d: d} },
                { vertex: vec3.create(), colour: colour, normal: vec3.create(), additional: {a: a, b: b, c: c, d: d} },
                { vertex: vec3.create(), colour: colour, normal: vec3.create(), additional: {a: a, b: b, c: c, d: d} },
                { vertex: vec3.create(), colour: colour, normal: vec3.create(), additional: {a: a, b: b, c: c, d: d} }
            ],
            position: vec3.create(),
            rotation: quat.create(),
            scale: vec3.fromValues(1, 1, 1)
        };

        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;

        this.resizeVertices();
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

        this.resizeVertices();
    }

    resizeVertices() {
        const bounds = findBoundsOfPoints([this.a, this.b, this.c, this.d]);

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