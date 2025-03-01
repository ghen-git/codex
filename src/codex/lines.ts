import { quat, vec2, vec3, vec4 } from "gl-matrix";
import { Object } from "./rendering/renderer";
import { flatCirclesDrawCall, flatQuadsDrawCall } from "./rendering/draw_calls";

export enum LineEnding {
    ROUND,
    STRAIGHT
}


export class Polyline {
    ends: LineEnding;
    colour: vec4;
    quads: Object;
    circles?: Object;
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

        if (this.ends == LineEnding.ROUND)
            this.circles = {
                triangles: [],
                vertices: [],
                position: vec3.create(),
                rotation: quat.create(),
                scale: vec3.fromValues(1, 1, 1)
            };

        this.changePoints(points);

        flatQuadsDrawCall.addObject(this.quads);

        if (this.ends == LineEnding.ROUND)
            flatCirclesDrawCall.addObject(this.circles!);
    }

    movePoint(pointIndex: number, newPos: vec2) {
        this.points[pointIndex] = newPos;

        this.resize();
    }

    changePoints(points: vec2[]) {
        if (points.length != this.points.length) {
            this.points = points;
            this.buildQuads();
        }
        else
            this.points = points;

        this.resize();
    }

    private resize() {
        this.setThickness(this.thickness);

        flatQuadsDrawCall.shouldUpdateBuffers = true;

        if (this.ends == LineEnding.ROUND)
            flatCirclesDrawCall.shouldUpdateBuffers = true;
    }

    buildQuads() {
        this.quads.triangles = [];
        this.quads.vertices = [];

        if (this.ends == LineEnding.ROUND) {
            this.circles!.triangles = [];
            this.circles!.vertices = [];
        }

        for (let i = 0; i < this.points.length; i++) {
            const quadI = i * 4;

            this.quads.triangles.push(
                [quadI, quadI + 1, quadI + 2],
                [quadI + 2, quadI + 3, quadI + 1]
            );
            this.quads.vertices.push(
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create() },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create() },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create() },
                { vertex: vec3.create(), colour: this.colour, normal: vec3.create() }
            );

            if (this.ends == LineEnding.ROUND) {
                this.circles!.triangles.push(
                    [quadI, quadI + 1, quadI + 2],
                    [quadI + 2, quadI + 3, quadI + 1]
                );
                this.circles!.vertices.push(
                    { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [0, 0], radius: this.thickness / 2 } },
                    { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [1, 0], radius: this.thickness / 2 } },
                    { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [0, 1], radius: this.thickness / 2 } },
                    { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [1, 1], radius: this.thickness / 2 } }
                );
            }
        }
    }

    setThickness(thickness: number) {
        this.thickness = thickness;

        this.refreshQuads();

        if (this.ends == LineEnding.ROUND) {
            this.circles!.vertices.forEach(v => v.additional!.radius = this.thickness / 2);
            this.refreshCircles();
        }
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

        if (!this.circles)
            return;

        for (let i = 0; i < this.points.length; i++) {
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
    circles?: Object;
    thickness: number;
    width: number;
    private _a: vec2;

    public get a() {
        return this._a;
    }
    public set a(value) {
        this._a = value;
        this.resize();
    }

    private _b: vec2;

    public get b(): vec2 {
        return this._b;
    }
    public set b(value: vec2) {
        this._b = value;
        this.resize();
    }

    constructor(a: vec2, b: vec2, ends: LineEnding, colour: vec4, thickness: number) {
        this.ends = ends;
        this.colour = colour;

        this.thickness = thickness;
        this._a = a;
        this._b = b;
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

        if (this.ends == LineEnding.ROUND) {
            this.circles = {
                triangles: [[0, 1, 2], [2, 3, 1], [4, 5, 6], [6, 7, 5]],
                vertices: [
                    { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [0, 0], radius: this.thickness / 2 } },
                    { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [1, 0], radius: this.thickness / 2 } },
                    { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [0, 1], radius: this.thickness / 2 } },
                    { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [1, 1], radius: this.thickness / 2 } },
                    { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [0, 0], radius: this.thickness / 2 } },
                    { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [1, 0], radius: this.thickness / 2 } },
                    { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [0, 1], radius: this.thickness / 2 } },
                    { vertex: vec3.create(), colour: this.colour, normal: vec3.create(), additional: { uv: [1, 1], radius: this.thickness / 2 } }
                ],
                position: vec3.create(),
                rotation: quat.create(),
                scale: vec3.fromValues(1, 1, 1)
            };
        }

        flatQuadsDrawCall.addObject(this.quads);

        if (this.ends == LineEnding.ROUND)
            flatCirclesDrawCall.addObject(this.circles!);

        this.resize();
    }

    private resize() {
        this.width = vec2.dist(this._a, this._b);

        this.setThickness(this.thickness);
        flatQuadsDrawCall.shouldUpdateBuffers = true;

        if (this.ends == LineEnding.ROUND)
            flatCirclesDrawCall.shouldUpdateBuffers = true;
    }

    setThickness(thickness: number) {
        this.thickness = thickness;

        this.refreshQuads();

        if (this.ends == LineEnding.ROUND) {
            this.circles!.vertices.forEach(v => v.additional!.radius = this.thickness / 2);
            this.refreshCircles();
        }
    }

    refreshQuads() {
        const normal = getNormal(this._a, this._b);
        const scaledNormal = vec2.scale(vec2.create(), normal, this.thickness / 2);

        // top left
        this.quads.vertices[0].vertex[0] = this._a[0] + scaledNormal[0];
        this.quads.vertices[0].vertex[1] = this._a[1] + scaledNormal[1];

        // top right
        this.quads.vertices[1].vertex[0] = this._b[0] + scaledNormal[0];
        this.quads.vertices[1].vertex[1] = this._b[1] + scaledNormal[1];

        // bottom left
        this.quads.vertices[2].vertex[0] = this._a[0] - scaledNormal[0];
        this.quads.vertices[2].vertex[1] = this._a[1] - scaledNormal[1];

        // bottom right
        this.quads.vertices[3].vertex[0] = this._b[0] - scaledNormal[0];
        this.quads.vertices[3].vertex[1] = this._b[1] - scaledNormal[1];
    }

    refreshCircles() {
        const halfThickness = this.thickness * 0.5;

        if (!this.circles)
            return;

        // top left for left circle
        this.circles.vertices[0].vertex[0] = this._a[0] - halfThickness;
        this.circles.vertices[0].vertex[1] = this._a[1] - halfThickness;

        // top right for left circle
        this.circles.vertices[1].vertex[0] = this._a[0] + halfThickness;
        this.circles.vertices[1].vertex[1] = this._a[1] - halfThickness;

        // bottom left for left circle
        this.circles.vertices[2].vertex[0] = this._a[0] - halfThickness;
        this.circles.vertices[2].vertex[1] = this._a[1] + halfThickness;

        // bottom right for left circle
        this.circles.vertices[3].vertex[0] = this._a[0] + halfThickness;
        this.circles.vertices[3].vertex[1] = this._a[1] + halfThickness;

        // top left for right circle
        this.circles.vertices[4].vertex[0] = this._b[0] - halfThickness;
        this.circles.vertices[4].vertex[1] = this._b[1] - halfThickness;

        // top right for right circle
        this.circles.vertices[5].vertex[0] = this._b[0] + halfThickness;
        this.circles.vertices[5].vertex[1] = this._b[1] - halfThickness;

        // bottom left for right circle
        this.circles.vertices[6].vertex[0] = this._b[0] - halfThickness;
        this.circles.vertices[6].vertex[1] = this._b[1] + halfThickness;

        // bottom right for right circle
        this.circles.vertices[7].vertex[0] = this._b[0] + halfThickness;
        this.circles.vertices[7].vertex[1] = this._b[1] + halfThickness;
    }
}

function getNormal(p1: vec2, p2: vec2) {
    let normal = vec2.fromValues(-(p2[1] - p1[1]), p2[0] - p1[0]);
    vec2.normalize(normal, normal);
    return normal;
}