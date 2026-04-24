import { quat, vec2, vec3, vec4 } from "gl-matrix";
import { RenderableMesh } from "./../shader_program";
import { CodexRenderer } from "./../codex_renderer";
import { axisAngleToRotationMatrix, EPSILON, rotateVectorWithMatrix } from "../../math";
import { MeshBuilder } from "./../meshes/mesh_builder";
import { Wireframe } from "./wireframe";

export class WireframeNative implements Wireframe {
    colour: vec4;
    public mesh: RenderableMesh;
    thickness: number;
    vertices: vec3[];
    lines: vec2[];
    render: boolean;

    constructor(vertices: vec3[], lines: vec2[], colour: vec4, render: boolean = false) {
        this.colour = colour;
        this.render = render;

        this.thickness = 1;
        this.vertices = vertices;
        this.lines = lines;

        this.mesh = {
            triangles: [],
            vertices: [],
            data: {
                position: vec3.create(),
                rotation: quat.create(),
                lines: this.lines
            }
        };

        this.uploadVerticesToMesh();
        MeshBuilder.flatColourVertices(this.mesh.vertices, this.colour);

        if (this.render)
            CodexRenderer.nativeLinesProgram.renderMesh(this.mesh);
    }
    
    changeVertices(newVertices: vec3[]) {
        this.vertices = newVertices;
    }

    uploadVerticesToMesh() {
        this.mesh.vertices = [];
        
        for (let i = 0; i < this.vertices.length; i++) {
            this.mesh.vertices.push({ position: this.vertices[i] });
        }
    }

    scheduleUpdate() {
        if (this.render)
            CodexRenderer.nativeLinesProgram.updateVertexBuffers = true;
    }

    getLines() {
        return this.lines;
    }

    getVertices() {
        return this.vertices;
    }

    remove() {
        if (this.render)
            CodexRenderer.nativeLinesProgram.removeMesh(this.mesh);
    }
}
