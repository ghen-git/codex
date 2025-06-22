import { quat, vec2, vec3, vec4 } from "gl-matrix";
import { Object } from "./rendering/renderer";
import { flatCirclesDrawCall, flatQuadsDrawCall } from "./rendering/draw_calls";
import { EPSILON, lerpVec2, lerpVec4 } from "../math_ops";
import { createQuad2D, resizeQuad2D } from "./meshes";

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

        this.changePoints(points);

        flatQuadsDrawCall.addObject(this.quads);
    }

    private resize() {
        this.quads.triangles = [];
        this.quads.vertices = [];

        const startDir = vec2.sub(vec2.create(), this.points[1], this.points[0]);
        const startNormal = vec2.normalize(vec2.create(), vec2.fromValues(startDir[1], -startDir[0]));
        const inverseStartNormal = vec2.scale(vec2.create(), startNormal, -1);
        const halfThickness = this.thickness * 0.5;

        let lastVertexPairIndex = 0;
        this.quads.vertices.push(
            this.vecToVertex(vec2.add(vec2.create(), this.points[0], vec2.scale(vec2.create(), startNormal, halfThickness))), // bottom left
            this.vecToVertex(vec2.add(vec2.create(), this.points[0], vec2.scale(vec2.create(), inverseStartNormal, halfThickness))), // top left
        )

        let lastDir = vec2.normalize(vec2.create(), startDir);
        let lastNormal = vec2.fromValues(lastDir[1], -lastDir[0]);

        for (let i = 1; i < this.points.length - 1; i++) {
            const dir = vec2.normalize(vec2.create(), vec2.sub(vec2.create(), this.points[i + 1], this.points[i]));
            const avgDir = vec2.normalize(
                vec2.create(), 
                [(lastDir[0] + dir[0]) / 2,
                (lastDir[1] + dir[1]) / 2]
            );
            const bottomNormal = vec2.fromValues(avgDir[1], -avgDir[0]);
            const topNormal = vec2.scale(vec2.create(), bottomNormal, -1);

            const scaledThickness = halfThickness / Math.abs(vec2.dot(bottomNormal, lastNormal));
            this.quads.vertices.push(
                this.vecToVertex(vec2.add(vec2.create(), this.points[i], vec2.scale(vec2.create(), bottomNormal, scaledThickness))), // bottom left
                this.vecToVertex(vec2.add(vec2.create(), this.points[i], vec2.scale(vec2.create(), topNormal, scaledThickness))), // top left
            )

            this.quads.triangles.push(
                [lastVertexPairIndex, lastVertexPairIndex + 1, lastVertexPairIndex + 2],
                [lastVertexPairIndex + 1, lastVertexPairIndex + 3, lastVertexPairIndex + 2]
            )

            lastVertexPairIndex += 2;
            lastDir = dir;
            lastNormal = vec2.fromValues(lastDir[1], -lastDir[0]);
        }

        const lastI = this.points.length - 1;
        const endDir = vec2.sub(vec2.create(), this.points[lastI], this.points[lastI - 1]);
        const endNormal = vec2.normalize(vec2.create(), vec2.fromValues(endDir[1], -endDir[0]));
        const inverseEndNormal = vec2.scale(vec2.create(), endNormal, -1);
        this.quads.triangles.push(
            [lastVertexPairIndex, lastVertexPairIndex + 1, lastVertexPairIndex + 2],
            [lastVertexPairIndex + 1, lastVertexPairIndex + 3, lastVertexPairIndex + 2]
        )
        this.quads.vertices.push(
            this.vecToVertex(vec2.add(vec2.create(), this.points[lastI], vec2.scale(vec2.create(), endNormal, halfThickness))), // bottom left
            this.vecToVertex(vec2.add(vec2.create(), this.points[lastI], vec2.scale(vec2.create(), inverseEndNormal, halfThickness))), // top left
        )

        flatQuadsDrawCall.shouldUpdateBuffers = true;
    }

    vecToVertex(v: vec2) {
        return { vertex: vec3.fromValues(v[0], v[1], 0), colour: this.colour, normal: vec3.create() }
    }

    movePoint(pointIndex: number, newPos: vec2) {
        this.points[pointIndex] = newPos;

        this.resize();
    }

    changePoints(points: vec2[]) {
        this.points = points;
        this.resize();
    }

    setThickness(thickness: number) {
        this.thickness = thickness;
        this.resize();
    }

    lengthSq() {
        let length = 0;
        let prev = this.points[0];

        for (let i = 1; i < this.points.length; i++) {
            let xSq = this.points[i][0] - prev[0];
            let ySq = this.points[i][1] - prev[1];
            length += xSq * xSq + ySq * ySq;
            prev = this.points[i];
        }

        return length;
    }

    remove() {
        flatQuadsDrawCall.removeObject(this.quads);
    }
}

export class Line {
    ends: LineEnding;
    colour: vec4;
    quads: Object;
    circles?: Object;
    thickness: number;
    width: number;

    private _startT: number;
    public get startT(): number {
        return this._startT;
    }
    public set startT(value: number) {
        this._startT = value;
    }
    private _endT: number;
    public get endT(): number {
        return this._endT;
    }
    public set endT(value: number) {
        this._endT = value;
    }

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

    constructor(a: vec2, b: vec2, ends: LineEnding, colour: vec4, thickness: number, startT?: number, endT?: number) {
        this.ends = ends;
        this.colour = colour;

        this.thickness = thickness;
        this._a = a;
        this._b = b;
        this._startT = startT !== undefined ? startT : 0.0;
        this._endT = endT !== undefined ? endT : 1.0;
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

        if (this.ends == LineEnding.ROUND && vec2.dist(a, b) > EPSILON) {
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

        this.resize();
    }

    setTBounds(startT: number, endT: number) {
        this._startT = startT;
        this._endT = endT;

        this.setThickness(this.thickness);
    }

    private resize() {
        this.width = vec2.dist(this._a, this._b);

        this.setThickness(this.thickness);
    }

    setThickness(thickness: number) {
        this.thickness = thickness;

        const lerpedA = lerpVec2(this._a, this._b, this._startT);
        const lerpedB = lerpVec2(this._a, this._b, this._endT);

        this.refreshQuads(lerpedA, lerpedB);
        flatQuadsDrawCall.shouldUpdateBuffers = true;

        if (this.ends == LineEnding.ROUND) {
            this.circles!.vertices.forEach(v => v.additional!.radius = this.thickness / 2);
            this.refreshCircles(lerpedA, lerpedB);
        }
    }

    refreshQuads(lerpedA: vec2, lerpedB: vec2) {
        const normal = getNormal(lerpedA, lerpedB);
        const scaledNormal = vec2.scale(vec2.create(), normal, this.thickness / 2);

        // top left
        this.quads.vertices[0].vertex[0] = lerpedA[0] + scaledNormal[0];
        this.quads.vertices[0].vertex[1] = lerpedA[1] + scaledNormal[1];

        // top right
        this.quads.vertices[1].vertex[0] = lerpedB[0] + scaledNormal[0];
        this.quads.vertices[1].vertex[1] = lerpedB[1] + scaledNormal[1];

        // bottom left
        this.quads.vertices[2].vertex[0] = lerpedA[0] - scaledNormal[0];
        this.quads.vertices[2].vertex[1] = lerpedA[1] - scaledNormal[1];

        // bottom right
        this.quads.vertices[3].vertex[0] = lerpedB[0] - scaledNormal[0];
        this.quads.vertices[3].vertex[1] = lerpedB[1] - scaledNormal[1];
    }

    refreshCircles(lerpedA: vec2, lerpedB: vec2) {
        const halfThickness = this.thickness * 0.5;

        if (!this.circles)
            return;

        // top left for left circle
        this.circles.vertices[0].vertex[0] = lerpedA[0] - halfThickness;
        this.circles.vertices[0].vertex[1] = lerpedA[1] - halfThickness;

        // top right for left circle
        this.circles.vertices[1].vertex[0] = lerpedA[0] + halfThickness;
        this.circles.vertices[1].vertex[1] = lerpedA[1] - halfThickness;

        // bottom left for left circle
        this.circles.vertices[2].vertex[0] = lerpedA[0] - halfThickness;
        this.circles.vertices[2].vertex[1] = lerpedA[1] + halfThickness;

        // bottom right for left circle
        this.circles.vertices[3].vertex[0] = lerpedA[0] + halfThickness;
        this.circles.vertices[3].vertex[1] = lerpedA[1] + halfThickness;

        // top left for right circle
        this.circles.vertices[4].vertex[0] = lerpedB[0] - halfThickness;
        this.circles.vertices[4].vertex[1] = lerpedB[1] - halfThickness;

        // top right for right circle
        this.circles.vertices[5].vertex[0] = lerpedB[0] + halfThickness;
        this.circles.vertices[5].vertex[1] = lerpedB[1] - halfThickness;

        // bottom left for right circle
        this.circles.vertices[6].vertex[0] = lerpedB[0] - halfThickness;
        this.circles.vertices[6].vertex[1] = lerpedB[1] + halfThickness;

        // bottom right for right circle
        this.circles.vertices[7].vertex[0] = lerpedB[0] + halfThickness;
        this.circles.vertices[7].vertex[1] = lerpedB[1] + halfThickness;
    }

    remove() {
        flatQuadsDrawCall.removeObject(this.quads);

        if (this.ends == LineEnding.ROUND) {
            flatCirclesDrawCall.removeObject(this.circles!);
        }
    }
}

function getNormal(p1: vec2, p2: vec2) {
    let normal = vec2.fromValues(-(p2[1] - p1[1]), p2[0] - p1[0]);
    vec2.normalize(normal, normal);
    return normal;
}