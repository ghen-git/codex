import { quat, vec3, vec4 } from "gl-matrix";
import { RenderableMesh } from "../shader_program";
import { randInt } from "../../math";

export class MeshBuilder {
    public static buildBox(sizeX: number, sizeY: number, sizeZ: number, colour: vec4): RenderableMesh {
        const mesh: RenderableMesh = {
            vertices: [
                {position: [-sizeX / 2, -sizeY / 2, -sizeZ / 2]},
                {position: [sizeX / 2, -sizeY / 2, -sizeZ / 2]},
                {position: [-sizeX / 2, sizeY / 2, -sizeZ / 2]},
                {position: [sizeX / 2, sizeY / 2, -sizeZ / 2]},
                {position: [-sizeX / 2, -sizeY / 2, sizeZ / 2]},
                {position: [sizeX / 2, -sizeY / 2, sizeZ / 2]},
                {position: [-sizeX / 2, sizeY / 2, sizeZ / 2]},
                {position: [sizeX / 2, sizeY / 2, sizeZ / 2]},
            ],
            triangles: [
                [0, 1, 2], [1, 3, 2], // front
                [1, 5, 3], [5, 7, 3], // right
                [5, 4, 7], [4, 6, 7], // back
                [4, 0, 6], [0, 2, 6], // left
                [4, 5, 0], [5, 1, 0], // bottom
                [2, 3, 6], [3, 7, 6], // top
            ],
            data: {
                position: vec3.fromValues(0, 0, 0),
                rotation: quat.create()
            }
        };
        
        mesh.vertices.forEach(vert => {
            vert.data = {colour: colour}
        });

        return mesh;
    }
}
