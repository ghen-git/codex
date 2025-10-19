import { quat, vec3, vec4 } from "gl-matrix";
import { RenderableMesh, Triangle, Vertex } from "../shader_program";
import { rand } from "../../math";

export class MeshBuilder {
    public static overrideColourWithRandomColours = false;

    public static buildBox(sizeX: number, sizeY: number, sizeZ: number, colour: vec4): RenderableMesh {
        const mesh: RenderableMesh = {
            vertices: [
                { position: [-sizeX / 2, -sizeY / 2, -sizeZ / 2] },
                { position: [sizeX / 2, -sizeY / 2, -sizeZ / 2] },
                { position: [-sizeX / 2, sizeY / 2, -sizeZ / 2] },
                { position: [sizeX / 2, sizeY / 2, -sizeZ / 2] },
                { position: [-sizeX / 2, -sizeY / 2, sizeZ / 2] },
                { position: [sizeX / 2, -sizeY / 2, sizeZ / 2] },
                { position: [-sizeX / 2, sizeY / 2, sizeZ / 2] },
                { position: [sizeX / 2, sizeY / 2, sizeZ / 2] },
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

        this.flatColourVertices(mesh.vertices, colour);

        return mesh;
    }
    /**
     * expecting a vertex order like this:
     * 
     * ```
     * 2---3
     * | \ |
     * 0---1
     * ```
     */
    public static triangulateQuad(vertexIndices: number[]): Triangle[] {
        return [
            [vertexIndices[0], vertexIndices[1], vertexIndices[2]],
            [vertexIndices[1], vertexIndices[3], vertexIndices[2]],
        ];
    }

    public static flatColourVertices(vertices: Vertex[], colour: vec4) {
        vertices.forEach(vert => {
            if (vert.data === undefined)
                vert.data = {};

            if (this.overrideColourWithRandomColours)
                colour = [rand(0, 1), 0, rand(0, 1), rand(0, 0.01)];
            vert.data.colour = colour;
        });
    }

    public static parseObj(objString: string): RenderableMesh {
        const vertices: Vertex[] = [];
        const triangles: Triangle[] = [];

        const lines = objString.split('\n');

        lines.forEach(line => {
            const info = line.replace('\r', '').split(' ');

            if (info[0] == 'v')
                vertices.push({ position: [parseFloat(info[1]), parseFloat(info[2]), parseFloat(info[3])]});
            else if(info[0] == 'f')
                triangles.push([parseInt(info[1])-1, parseInt(info[2])-1, parseInt(info[3])-1]);
        })

        return {
            vertices: vertices,
            triangles: triangles,
            data: {
                position: vec3.fromValues(0, 0, 0),
                rotation: quat.create()
            }
        }
    }
}
