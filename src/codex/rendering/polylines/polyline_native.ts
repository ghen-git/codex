import { quat, vec3, vec4 } from "gl-matrix";
import { RenderableMesh } from "./../shader_program";
import { CodexRenderer } from "./../codex_renderer";
import { axisAngleToRotationMatrix, EPSILON, rotateVectorWithMatrix } from "../../math";
import { MeshBuilder } from "./../meshes/mesh_builder";
import { Polyline } from "./polyline";

export class PolylineNative implements Polyline {
    colour: vec4;
    mesh: RenderableMesh;
    circles?: RenderableMesh;
    thickness: number;
    points: vec3[];
    render: boolean;

    constructor(points: vec3[], colour: vec4, render: boolean = false) {
        this.colour = colour;
        this.render = render;

        this.thickness = 1;
        this.points = [];

        this.mesh = {
            triangles: [],
            vertices: [],
            data: {
                position: vec3.create(),
                rotation: quat.create(),
                lines: []
            }
        };

        if (this.render)
            CodexRenderer.nativeLinesProgram.renderMesh(this.mesh);

        this.changePoints(points);
    }

    private resize(keepVertices: boolean = false) {
        if (this.points.length < 2) {
            this.mesh.data!.lines = [];
            this.mesh.vertices = [];
            if (this.render)
                CodexRenderer.nativeLinesProgram.updateVertexBuffers = true;
            return;
        }

        if (!keepVertices) {
            this.buildVerticesFromPoints();
        }
        else {
            for(let i = 0; i < this.points.length; i++) {
                this.mesh.vertices[i].position = this.points[i];
            }
        }

        if (this.render)
            CodexRenderer.nativeLinesProgram.updateVertexBuffers = true;
    }

    buildVerticesFromPoints() {
        this.mesh.data!.lines = [];
        this.mesh.vertices = [];

        this.mesh.vertices.push({ position: this.points[0] });

        for (let i = 1; i < this.points.length; i++) {
            this.mesh.vertices.push({ position: this.points[i] });

            this.mesh.data!.lines.push([i-1, i]);
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
            CodexRenderer.nativeLinesProgram.removeMesh(this.mesh);
    }
}
