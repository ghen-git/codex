import { quat, vec2, vec3, vec4 } from "gl-matrix";
import { RenderableMesh, Vertex } from "./shader_program";
import { CodexRenderer } from "./codex_renderer";
import { rand } from "../math";

export class Polyline {
    colour: vec4;
    mesh: RenderableMesh;
    circles?: RenderableMesh;
    thickness: number;
    points: vec3[];

    constructor(points: vec3[], colour: vec4, thickness: number) {
        this.colour = colour;

        this.thickness = thickness;
        this.points = [];

        this.mesh = {
            triangles: [],
            vertices: [],
            data: {
                position: vec3.create(),
                rotation: quat.create()
            }
        };

        CodexRenderer.meshes3DProgram.renderMesh(this.mesh);
        this.changePoints(points);
    }

    private resize() {
        this.mesh.triangles = [];
        this.mesh.vertices = [];

        const up = vec3.fromValues(0, 1, 0);

        const startDir = vec3.sub(vec3.create(), this.points[1], this.points[0]);
        vec3.normalize(startDir, startDir);

        const startRightNormal = vec3.cross(vec3.create(), startDir, up);
        const inverseStartNormal = vec3.scale(vec3.create(), startRightNormal, -1);
        const halfThickness = this.thickness * 0.5;

        let lastVertexPairIndex = 0;
        this.mesh.vertices.push(
            this.vecToVertex(vec3.add(vec3.create(), this.points[0], vec3.scale(vec3.create(), startRightNormal, halfThickness))), // bottom left
            this.vecToVertex(vec3.add(vec3.create(), this.points[0], vec3.scale(vec3.create(), inverseStartNormal, halfThickness))), // top left
        )

        let lastDir = startDir;
        let lastNormal = startRightNormal;

        for (let i = 1; i < this.points.length - 1; i++) {
            const dir = vec3.sub(vec3.create(), this.points[i + 1], this.points[i]);
            vec3.normalize(dir, dir);

            // const avgDir = vec2.normalize(
            //     vec2.create(),
            //     [(lastDir[0] + dir[0]) / 2,
            //     (lastDir[1] + dir[1]) / 2]
            // );
            const bottomNormal = vec3.cross(vec3.create(), lastDir, dir);
            const topNormal = vec3.scale(vec3.create(), bottomNormal, -1);

            const scaledThickness = halfThickness / Math.abs(vec3.dot(bottomNormal, lastNormal));
            this.mesh.vertices.push(
                this.vecToVertex(vec3.add(vec3.create(), this.points[i], vec3.scale(vec3.create(), bottomNormal, scaledThickness))), // bottom left
                this.vecToVertex(vec3.add(vec3.create(), this.points[i], vec3.scale(vec3.create(), topNormal, scaledThickness))), // top left
            )

            this.mesh.triangles.push(
                [lastVertexPairIndex, lastVertexPairIndex + 1, lastVertexPairIndex + 2],
                [lastVertexPairIndex + 1, lastVertexPairIndex + 3, lastVertexPairIndex + 2]
            )

            lastVertexPairIndex += 2;
            lastDir = dir;
            lastNormal = bottomNormal;
        }

        const lastI = this.points.length - 1;
        const endDir = vec3.sub(vec3.create(), this.points[lastI], this.points[lastI - 1]);
        vec3.normalize(endDir, endDir);

        const endRightNormal = vec3.cross(vec3.create(), endDir, up);
        const inverseEndNormal = vec3.scale(vec3.create(), endRightNormal, -1);
        this.mesh.triangles.push(
            [lastVertexPairIndex, lastVertexPairIndex + 1, lastVertexPairIndex + 2],
            [lastVertexPairIndex + 1, lastVertexPairIndex + 3, lastVertexPairIndex + 2]
        )
        this.mesh.vertices.push(
            this.vecToVertex(vec3.add(vec3.create(), this.points[lastI], vec3.scale(vec3.create(), endRightNormal, halfThickness))), // bottom left
            this.vecToVertex(vec3.add(vec3.create(), this.points[lastI], vec3.scale(vec3.create(), inverseEndNormal, halfThickness))), // top left
        )

        CodexRenderer.meshes3DProgram.shouldUpdateBuffers = true;
    }

    vecToVertex(v: vec3): Vertex {
        return { position: vec3.fromValues(v[0], v[1], v[2]), data: { colour: [rand(0, 1), rand(0, 1), rand(0, 1), 1] } };
    }

    changePoints(points: vec3[]) {
        this.points = points;
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
        CodexRenderer.meshes3DProgram.removeMesh(this.mesh);
    }
}
