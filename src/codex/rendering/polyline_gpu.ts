import { quat, vec3, vec4 } from "gl-matrix";
import { RenderableMesh } from "./shader_program";
import { CodexRenderer } from "./codex_renderer";
import { MeshBuilder } from "./meshes/mesh_builder";

export class PolylineGPU {
    colour: vec4;
    mesh: RenderableMesh;
    circles?: RenderableMesh;
    thickness: number;
    points: vec3[];
    render: boolean;

    constructor(points: vec3[], colour: vec4, thickness: number, render: boolean = false) {
        this.colour = colour;
        this.render = render;

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

        if (this.render)
            CodexRenderer.lines3DProgram.renderMesh(this.mesh);
        this.changePoints(points);
    }

    private resize(keepVertices: boolean = false) {
        if (this.points.length < 2) {
            this.mesh.triangles = [];
            this.mesh.vertices = [];
            if (this.render)
                CodexRenderer.lines3DProgram.shouldUpdateBuffers = true;
            return;
        }

        if (!keepVertices)
            this.buildVerticesFromPoints();

        this.mesh.vertices[0].position = this.points[0];
        this.mesh.vertices[1].position = this.points[0];
        this.mesh.vertices[0].data!.previousPoint = this.points[0];
        this.mesh.vertices[1].data!.previousPoint = this.points[0];
        this.mesh.vertices[0].data!.nextPoint = this.points[1];
        this.mesh.vertices[1].data!.nextPoint = this.points[1];

        for (let i = 1; i < this.points.length - 1; i++) {
            const offset = i * 2;

            this.mesh.vertices[offset].position = this.points[i];
            this.mesh.vertices[offset + 1].position = this.points[i];
            this.mesh.vertices[offset].data!.previousPoint = this.points[i - 1];
            this.mesh.vertices[offset + 1].data!.previousPoint = this.points[i - 1];
            this.mesh.vertices[offset].data!.nextPoint = this.points[i + 1];
            this.mesh.vertices[offset + 1].data!.nextPoint = this.points[i + 1];
        }

        const offset = (this.points.length - 1) * 2;
        this.mesh.vertices[offset].position = this.points[this.points.length - 1];
        this.mesh.vertices[offset + 1].position = this.points[this.points.length - 1];
        this.mesh.vertices[offset].data!.previousPoint = this.points[this.points.length - 2];
        this.mesh.vertices[offset + 1].data!.previousPoint = this.points[this.points.length - 2];
        this.mesh.vertices[offset].data!.nextPoint = this.points[this.points.length - 1];
        this.mesh.vertices[offset + 1].data!.nextPoint = this.points[this.points.length - 1];

        if (this.render)
            CodexRenderer.lines3DProgram.shouldUpdateBuffers = true;
    }

    buildVerticesFromPoints() {
        this.mesh.triangles = [];
        this.mesh.vertices = [];

        this.mesh.vertices.push(
            { position: [0, 0, 0], data: { normalDir: -1 } }, // bottom
            { position: [0, 0, 0], data: { normalDir: 1 } }, // top
        );

        for (let i = 0; i < this.points.length - 1; i++) {
            this.mesh.vertices.push(
                { position: [0, 0, 0], data: { normalDir: -1 } },
                { position: [0, 0, 0], data: { normalDir: 1 } }
            );

            const offset = i * 2;

            const quad = MeshBuilder.triangulateQuad([offset + 0, offset + 2, offset + 1, offset + 3]);

            this.mesh.triangles.push(quad[0], quad[1]);
        }

        MeshBuilder.flatColourVertices(this.mesh.vertices, this.colour);
    }

    changePoints(points: vec3[]) {
        const keepVertices = points.length == this.points.length;

        this.points = points;
        this.resize(keepVertices);
    }

    remove() {
        if (this.render)
            CodexRenderer.lines3DProgram.removeMesh(this.mesh);
    }
}
