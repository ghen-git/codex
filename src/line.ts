import { quat, vec2, vec3, vec4 } from "gl-matrix";
import { Object } from "./renderer";

export enum LineEnding {
    ROUND,
    STRAIGHT
}


export class Polyline {
    ends: LineEnding;
    colour: vec4;
    quads: Object;
    circles: Object;
    thickness: number;
    points: vec2[];

    constructor(points: vec2[], ends: LineEnding, colour: vec4, thickness: number) {
        this.ends = ends;
        this.colour = colour;

        this.thickness = thickness;
        this.points = [];

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

        this.resize(points);
    }

    changeEnding(ending: LineEnding) {
        this.ends = ending;
    }

    resize(points: vec2[]) {
        if (points.length != this.points.length) {
            this.points = points;
            this.buildQuads();
        }
        else    
            this.points = points;

        this.setThickness(this.thickness);
    }

    buildQuads() {
        this.quads.triangles = [];
        this.quads.vertices = [];
        this.circles.triangles = [];
        this.circles.vertices = [];

        for (let i = 0; i < this.points.length; i++) {
            const quadI = i * 4;

            this.quads.triangles.push(
                [quadI, quadI + 1, quadI + 2],
                [quadI + 2, quadI + 3, quadI + 1]
            );
            this.circles.triangles.push(
                [quadI, quadI + 1, quadI + 2],
                [quadI + 2, quadI + 3, quadI + 1]
            );
            this.quads.vertices.push(
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create() },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create() },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create() },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create() }
            );
            this.circles.vertices.push(
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [0, 0] } },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [1, 0] } },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [0, 1] } },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [1, 1] } }
            );
        }
    }

    setThickness(thickness: number) {
        this.thickness = thickness;

        this.refreshQuads();
        this.refreshCircles();
    }

    refreshQuads() {
        let lastPoint = this.points[0];
        for (let i = 1; i < this.points.length; i++) {
            let currPoint = this.points[i];
            const quadI = i * 4;

            const normal = getNormal(lastPoint, currPoint);
            const scaledNormal = vec2.scale(vec2.create(), normal, this.thickness / 2);

            // top left
            this.quads.vertices[quadI + 0].vertex[0] = lastPoint[0] + scaledNormal[0];
            this.quads.vertices[quadI + 0].vertex[1] = lastPoint[1] + scaledNormal[1];

            // top right
            this.quads.vertices[quadI + 1].vertex[0] = currPoint[0] + scaledNormal[0];
            this.quads.vertices[quadI + 1].vertex[1] = currPoint[1] + scaledNormal[1];

            // bottom left
            this.quads.vertices[quadI + 2].vertex[0] = lastPoint[0] - scaledNormal[0];
            this.quads.vertices[quadI + 2].vertex[1] = lastPoint[1] - scaledNormal[1];

            // bottom right
            this.quads.vertices[quadI + 3].vertex[0] = currPoint[0] - scaledNormal[0];
            this.quads.vertices[quadI + 3].vertex[1] = currPoint[1] - scaledNormal[1];

            lastPoint = currPoint;
        }
    }

    refreshCircles() {
        const halfThickness = this.thickness * 0.5;

        for (let i = 1; i < this.points.length - 1; i++) {
            let currPoint = this.points[i];
            const quadI = i * 4;

            // top left
            this.circles.vertices[quadI + 0].vertex[0] = currPoint[0] - halfThickness;
            this.circles.vertices[quadI + 0].vertex[1] = currPoint[1] - halfThickness;

            // top right
            this.circles.vertices[quadI + 1].vertex[0] = currPoint[0] + halfThickness;
            this.circles.vertices[quadI + 1].vertex[1] = currPoint[1] - halfThickness;

            // bottom left
            this.circles.vertices[quadI + 2].vertex[0] = currPoint[0] - halfThickness;
            this.circles.vertices[quadI + 2].vertex[1] = currPoint[1] + halfThickness;

            // bottom right
            this.circles.vertices[quadI + 3].vertex[0] = currPoint[0] + halfThickness;
            this.circles.vertices[quadI + 3].vertex[1] = currPoint[1] + halfThickness;
        }
    }
}

export class Line {
    ends: LineEnding;
    colour: vec4;
    quads: Object;
    circles: Object;
    thickness: number;
    width: number;
    a: vec2;
    b: vec2;

    constructor(a: vec2, b: vec2, ends: LineEnding, colour: vec4, thickness: number) {
        this.ends = ends;
        this.colour = colour;

        this.thickness = thickness;
        this.a = a;
        this.b = b;
        this.width = vec2.distance(a, b);

        this.quads = {
            triangles: [[0, 1, 2], [2, 3, 1]],
            vertices: [
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create() },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create() },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create() },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create() }
            ],
            position: vec3.create(),
            rotation: quat.create(),
            scale: vec3.fromValues(1, 1, 1)
        };

        this.circles = {
            triangles: [[0, 1, 2], [2, 3, 1]],
            vertices: [
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [0, 0] } },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [1, 0] } },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [0, 1] } },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [1, 1] } }
            ],
            position: vec3.create(),
            rotation: quat.create(),
            scale: vec3.fromValues(1, 1, 1)
        };

        this.resize({ a: a, b: b });
    }

    changeEnding(ending: LineEnding) {
        this.ends = ending;
    }

    resize(newPoints: { a?: vec2, b?: vec2 }) {
        if (newPoints.a !== undefined)
            this.a = newPoints.a;
        if (newPoints.b !== undefined)
            this.b = newPoints.b;

        this.width = vec2.dist(this.a, this.b);

        this.setThickness(this.thickness);
    }

    setThickness(thickness: number) {
        this.thickness = thickness;

        this.refreshQuads();
        this.refreshCircles();
    }

    refreshQuads() {
        const normal = getNormal(this.a, this.b);
        const scaledNormal = vec2.scale(vec2.create(), normal, this.thickness / 2);

        // top left
        this.quads.vertices[0].vertex[0] = this.a[0] + scaledNormal[0];
        this.quads.vertices[0].vertex[1] = this.a[1] + scaledNormal[1];

        // top right
        this.quads.vertices[1].vertex[0] = this.b[0] + scaledNormal[0];
        this.quads.vertices[1].vertex[1] = this.b[1] + scaledNormal[1];

        // bottom left
        this.quads.vertices[2].vertex[0] = this.a[0] - scaledNormal[0];
        this.quads.vertices[2].vertex[1] = this.a[1] - scaledNormal[1];

        // bottom right
        this.quads.vertices[3].vertex[0] = this.b[0] - scaledNormal[0];
        this.quads.vertices[3].vertex[1] = this.b[1] - scaledNormal[1];
    }

    refreshCircles() {
        const halfThickness = this.thickness * 0.5;

        // top left
        this.circles.vertices[0].vertex[0] = this.b[0] - halfThickness;
        this.circles.vertices[0].vertex[1] = this.b[1] - halfThickness;

        // top right
        this.circles.vertices[1].vertex[0] = this.b[0] + halfThickness;
        this.circles.vertices[1].vertex[1] = this.b[1] - halfThickness;

        // bottom left
        this.circles.vertices[2].vertex[0] = this.b[0] - halfThickness;
        this.circles.vertices[2].vertex[1] = this.b[1] + halfThickness;

        // bottom right
        this.circles.vertices[3].vertex[0] = this.b[0] + halfThickness;
        this.circles.vertices[3].vertex[1] = this.b[1] + halfThickness;
    }
}

function getNormal(p1: vec2, p2: vec2) {
    let normal = vec2.fromValues(-(p2[1] - p1[1]), p2[0] - p1[0]);
    vec2.normalize(normal, normal);
    return normal;
}