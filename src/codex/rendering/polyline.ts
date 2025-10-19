import { quat, vec3, vec4 } from "gl-matrix";
import { RenderableMesh } from "./shader_program";
import { CodexRenderer } from "./codex_renderer";
import { axisAngleToRotationMatrix, EPSILON, rotateVectorWithMatrix } from "../math";
import { MeshBuilder } from "./meshes/mesh_builder";

export class Polyline {
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
            CodexRenderer.meshes3DProgram.renderMesh(this.mesh);

        this.changePoints(points);
    }

    private resize(keepVertices: boolean = false) {
        if (this.points.length < 2) {
            this.mesh.triangles = [];
            this.mesh.vertices = [];
            if (this.render)
                CodexRenderer.meshes3DProgram.shouldUpdateBuffers = true;
            return;
        }

        const tangents = this.computeTangents();
        const normals = this.computeParallelTransport(tangents);
        tangents.push(vec3.clone(tangents[tangents.length - 1]));
        normals.push(vec3.clone(normals[normals.length - 1]));

        if (!keepVertices)
            this.buildVerticesFromPoints();

        let previousRightNormal = vec3.clone(normals[0]);
        let previousTopNormal = vec3.cross(vec3.create(), tangents[0], normals[0]);
        let previousLeftNormal = vec3.scale(vec3.create(), previousRightNormal, -1);
        let previousBottomNormal = vec3.scale(vec3.create(), previousTopNormal, -1);

        const halfThickness = this.thickness * 0.5;

        for (let i = 0; i < tangents.length; i++) {
            const vertexOffset = i * 4;

            const rightNormal = vec3.clone(normals[i]);
            const topNormal = vec3.cross(vec3.create(), tangents[i], normals[i]);
            const leftNormal = vec3.scale(vec3.create(), rightNormal, -1);
            const bottomNormal = vec3.scale(vec3.create(), topNormal, -1);

            const avgRightNormal = vec3.normalize(vec3.create(), [
                ((previousRightNormal[0] + rightNormal[0]) / 2),
                ((previousRightNormal[1] + rightNormal[1]) / 2),
                ((previousRightNormal[2] + rightNormal[2]) / 2)
            ]);
            const avgTopNormal = vec3.normalize(vec3.create(), [
                ((previousTopNormal[0] + topNormal[0]) / 2),
                ((previousTopNormal[1] + topNormal[1]) / 2),
                ((previousTopNormal[2] + topNormal[2]) / 2)
            ]);
            const avgLeftNormal = vec3.normalize(vec3.create(), [
                ((previousLeftNormal[0] + leftNormal[0]) / 2),
                ((previousLeftNormal[1] + leftNormal[1]) / 2),
                ((previousLeftNormal[2] + leftNormal[2]) / 2)
            ]);
            const avgBottomNormal = vec3.normalize(vec3.create(), [
                ((previousBottomNormal[0] + bottomNormal[0]) / 2),
                ((previousBottomNormal[1] + bottomNormal[1]) / 2),
                ((previousBottomNormal[2] + bottomNormal[2]) / 2)
            ]);

            const rightDistance = halfThickness / Math.abs(vec3.dot(avgRightNormal, previousRightNormal));
            const topDistance = halfThickness / Math.abs(vec3.dot(avgTopNormal, previousTopNormal));
            const leftDistance = halfThickness / Math.abs(vec3.dot(avgLeftNormal, previousLeftNormal));
            const bottomDistance = halfThickness / Math.abs(vec3.dot(avgBottomNormal, previousBottomNormal));

            const scaledRightNormal = vec3.scale(vec3.create(), avgRightNormal, rightDistance);
            const scaledTopNormal = vec3.scale(vec3.create(), avgTopNormal, topDistance);
            const scaledLeftNormal = vec3.scale(vec3.create(), avgLeftNormal, leftDistance);
            const scaledBottomNormal = vec3.scale(vec3.create(), avgBottomNormal, bottomDistance);

            this.mesh.vertices[vertexOffset].position = vec3.add(vec3.create(), this.points[i], scaledRightNormal);
            this.mesh.vertices[vertexOffset + 1].position = vec3.add(vec3.create(), this.points[i], scaledTopNormal);
            this.mesh.vertices[vertexOffset + 2].position = vec3.add(vec3.create(), this.points[i], scaledLeftNormal);
            this.mesh.vertices[vertexOffset + 3].position = vec3.add(vec3.create(), this.points[i], scaledBottomNormal);

            previousRightNormal = rightNormal;
            previousTopNormal = topNormal;
            previousLeftNormal = leftNormal;
            previousBottomNormal = bottomNormal;
        }

        if (this.render)
            CodexRenderer.meshes3DProgram.shouldUpdateBuffers = true;
    }

    buildVerticesFromPoints() {
        this.mesh.triangles = [];
        this.mesh.vertices = [];

        this.mesh.vertices.push(
            { position: [0, 0, 0] }, // right
            { position: [0, 0, 0] }, // top
            { position: [0, 0, 0] }, // left
            { position: [0, 0, 0] }, // bottom
        );

        for (let i = 0; i < this.points.length - 1; i++) {
            this.mesh.vertices.push(
                { position: [0, 0, 0] },
                { position: [0, 0, 0] },
                { position: [0, 0, 0] },
                { position: [0, 0, 0] },
            );

            const offset = i * 4;

            const quad1 = MeshBuilder.triangulateQuad([offset + 0, offset + 4, offset + 1, offset + 5]);
            const quad2 = MeshBuilder.triangulateQuad([offset + 1, offset + 5, offset + 2, offset + 6]);
            const quad3 = MeshBuilder.triangulateQuad([offset + 2, offset + 6, offset + 3, offset + 7]);
            const quad4 = MeshBuilder.triangulateQuad([offset + 3, offset + 7, offset + 0, offset + 4]);

            this.mesh.triangles.push(
                quad1[0], quad1[1],
                quad2[0], quad2[1],
                quad3[0], quad3[1],
                quad4[0], quad4[1],
            )
        }

        MeshBuilder.flatColourVertices(this.mesh.vertices, this.colour);
    }

    computeParallelTransport(tangents: vec3[]) {
        // https://help.luddy.indiana.edu/techreports/techreports/TR425.pdf
        const normals: vec3[] = [];

        normals.push(this.computeInitialNormal(tangents[0]));

        for (let i = 0; i < tangents.length - 1; i++) {
            const b = vec3.cross(vec3.create(), tangents[i], tangents[i + 1]);

            if (vec3.length(b) < EPSILON) {
                normals.push(vec3.clone(normals[i]));
                continue;
            }

            vec3.normalize(b, b);

            const theta = Math.acos(vec3.dot(tangents[i], tangents[i + 1]));

            // rotate the last normal on the axis B by theta
            const matrix = axisAngleToRotationMatrix([b[0], b[1], b[2], theta]);
            normals.push(rotateVectorWithMatrix(normals[i], matrix));
        }

        return normals;
    }

    computeInitialNormal(initialTangent: vec3) {
        let initialNormal: vec3;
        if (Math.abs(initialTangent[1]) > (1.0 - EPSILON))
            initialNormal = vec3.cross(vec3.create(), initialTangent, vec3.fromValues(0, 0, 1));
        else
            initialNormal = vec3.cross(vec3.create(), initialTangent, vec3.fromValues(0, 1, 0));

        vec3.normalize(initialNormal, initialNormal);
        return initialNormal;
    }

    computeTangents() {
        const tangents: vec3[] = [];

        for (let i = 0; i < this.points.length - 1; i++) {
            const tangent = vec3.sub(vec3.create(), this.points[i + 1], this.points[i]);
            vec3.normalize(tangent, tangent);
            tangents.push(tangent);
        }

        return tangents;
    }

    changePoints(points: vec3[]) {
        const keepVertices = points.length == this.points.length;

        this.points = points;
        this.resize(keepVertices);
    }

    remove() {
        if (this.render)
            CodexRenderer.meshes3DProgram.removeMesh(this.mesh);
    }
}
