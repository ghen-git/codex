import { quat, vec3 } from "gl-matrix";
import { Polyline } from "./polyline";
import { RenderableMesh } from "./shader_program";

export class PolylineGroup {
    polylines: Polyline[];
    mesh: RenderableMesh;

    constructor() {
        this.polylines = [];
        this.mesh = {
            triangles: [],
            vertices: [],
            data: {
                position: vec3.create(),
                rotation: quat.create()
            }
        }
    }

    public rebuildMesh() {
        this.mesh.vertices = [];

        this.polylines.forEach(polyline => {
            this.mesh.vertices.push(...polyline.mesh.vertices);
        });

        this.offsetTriangleIndices();
    }

    public addPolyline(polyline: Polyline, updateMesh: boolean = true) {
        this.polylines.push(polyline);


        if (updateMesh) {
            this.mesh.vertices.push(...polyline.mesh.vertices);
            this.offsetTriangleIndices();
        }
    }

    offsetTriangleIndices() {
        this.mesh.triangles = [];

        let offset = 0;

        this.polylines.forEach((line) => {
            line.mesh.triangles.forEach(triangle => {
                this.mesh.triangles.push([offset + triangle[0], offset + triangle[1], offset + triangle[2]]);
            });

            offset += line.mesh.vertices.length;
        });
    }
}
