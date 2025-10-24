import { quat, vec3, vec4 } from "gl-matrix";
import { RenderableMesh, Triangle, Vertex } from "../shader_program";
import { rand, rotate180 } from "../../math";

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
                colour = [rand(0, 1), rand(0, 1), rand(0, 1), 1];
            vert.data.colour = colour;
        });
    }

    public static parseObj(objString: string, exclusiveVerticesForEachTriangle: boolean = false): RenderableMesh {
        let vertices: Vertex[] = [];
        let triangles: Triangle[] = [];

        const lines = objString.split('\n');

        lines.forEach(line => {
            const info = line.replace('\r', '').split(' ');

            if (info[0] == 'v')
                vertices.push({ position: [parseFloat(info[1]), parseFloat(info[2]), parseFloat(info[3])] });
            else if (info[0] == 'f')
                triangles.push([parseInt(info[3]) - 1, parseInt(info[2]) - 1, parseInt(info[1]) - 1]);
        })

        const mesh = {
            vertices: vertices,
            triangles: triangles,
            data: {
                position: vec3.fromValues(0, 0, 0),
                rotation: quat.create()
            }
        };

        if (exclusiveVerticesForEachTriangle)
            MeshBuilder.createVerticesForEachTriangle(mesh);

        return mesh;
    }

    public static createVerticesForEachTriangle(mesh: RenderableMesh) {
        const newVertices: Vertex[] = [];
        const newTriangles: Triangle[] = [];

        let vertexIndex: number = 0;
        mesh.triangles.forEach(triangle => {
            newVertices.push({ position: vec3.clone(mesh.vertices[triangle[0]].position), data: mesh.vertices[triangle[0]].data });
            newVertices.push({ position: vec3.clone(mesh.vertices[triangle[1]].position), data: mesh.vertices[triangle[1]].data });
            newVertices.push({ position: vec3.clone(mesh.vertices[triangle[2]].position), data: mesh.vertices[triangle[2]].data });
            newTriangles.push([vertexIndex, vertexIndex + 1, vertexIndex + 2]);

            vertexIndex += 3;
        });

        mesh.vertices = newVertices;
        mesh.triangles = newTriangles;
    }

    public static cloneMesh(mesh: RenderableMesh) {
        const clone: RenderableMesh = {
            vertices: mesh.vertices,
            triangles: mesh.triangles,
            data: {
                position: vec3.clone(mesh.data!.position),
                rotation: quat.clone(mesh.data!.rotation)
            }
        };

        if(mesh.data!.lines !== undefined) {
            clone.data!.lines = mesh.data!.lines;
        }

        // mesh.vertices.forEach(vertex => {
        //     const newVertex: Vertex = { position: vec3.clone(vertex.position) };

        //     if(vertex.data !== undefined) {
        //         newVertex.data = {};
        //         newVertex.data.colour = vec4.clone(vertex.data.colour);

        //         if(vertex.data.normal !== undefined) {
        //             newVertex.data.normal = vec3.clone(vertex.data.normal);
        //         }
        //     }

        //     clone.vertices.push(newVertex);
        // });

        // mesh.triangles.forEach(triangle => {
        //     clone.triangles.push(vec3.clone(triangle));
        // })

        return clone;
    }

    public static computeNormalsFromTriangles(mesh: RenderableMesh) {
        const vertexNormals: vec3[][] = [];

        mesh.triangles.forEach(triangle => {
            const vi1 = triangle[0];
            const vi2 = triangle[1];
            const vi3 = triangle[2];

            const v1v2 = vec3.sub(vec3.create(), mesh.vertices[vi2].position, mesh.vertices[vi1].position);
            const v1v3 = vec3.sub(vec3.create(), mesh.vertices[vi3].position, mesh.vertices[vi1].position);

            if (vertexNormals[vi1] === undefined)
                vertexNormals[vi1] = [];
            if (vertexNormals[vi2] === undefined)
                vertexNormals[vi2] = [];
            if (vertexNormals[vi3] === undefined)
                vertexNormals[vi3] = [];

            const normal = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), v1v2, v1v3));

            vertexNormals[vi1].push(normal);
            vertexNormals[vi2].push(normal);
            vertexNormals[vi3].push(normal);
        });

        for (let i = 0; i < vertexNormals.length; i++) {
            const normalSum = vec3.fromValues(0, 0, 0);

            vertexNormals[i].forEach(normal => vec3.add(normalSum, normalSum, normal));
            vec3.scale(normalSum, normalSum, -(1 / vertexNormals[i].length));

            mesh.vertices[i].data!.normal = normalSum;
        }
    }
}
