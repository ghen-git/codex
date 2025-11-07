import { quat, vec2, vec3 } from "gl-matrix";
import { Polyline, PolylineType } from "./polyline";
import { RenderableMesh } from "./../shader_program";

export class PolylineGroup {
    polylines: Polyline[];
    mesh: RenderableMesh;
    type: PolylineType;

    constructor(type: PolylineType) {
        this.type = type;

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
        if (this.type == PolylineType.NATIVE)
            this.mesh.data!.lines = [];
        else
            this.mesh.triangles = [];

        let offset = 0;

        this.polylines.forEach((polyline) => {
            if (this.type == PolylineType.NATIVE)
                polyline.mesh.data!.lines.forEach((line: vec2) => {
                    this.mesh.data!.lines.push([offset + line[0], offset + line[1]]);
                });
            else
                polyline.mesh.triangles.forEach(triangle => {
                    this.mesh.triangles.push([offset + triangle[0], offset + triangle[1], offset + triangle[2]]);
                });

            offset += polyline.mesh.vertices.length;
        });
    }
}
