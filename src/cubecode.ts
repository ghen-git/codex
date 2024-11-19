import { vec3, vec4 } from "gl-matrix";
import { axisAngleToQuat, rand, rgbToScreenSpace, toRad } from "./math_ops";
import { Renderer, Triangle, VertexData } from "./renderer";

const colours = {
    deep_dark_red: rgbToScreenSpace(79, 0, 11),
    dark_red: rgbToScreenSpace(114, 0, 38),
    pink: rgbToScreenSpace(206, 66, 87),
    salmon: rgbToScreenSpace(255, 127, 81),
    orange: rgbToScreenSpace(255, 155, 84)
};

export const cubeVertices: VertexData[] = [
    { vertex: [-.5, -.5 + -.0, -.5], colour: colours.orange, normal: [0.0, -1.0, 0.0] }, // 
    { vertex: [.5, -.5 + -.0, -.5], colour: colours.orange, normal: [0.0, -1.0, 0.0] },
    { vertex: [-.5, -.5 + -.0, .5], colour: colours.orange, normal: [0.0, -1.0, 0.0] },
    { vertex: [.5, -.5 + -.0, .5], colour: colours.orange, normal: [0.0, -1.0, 0.0] }, // bottom face 0 - 3
    { vertex: [-.5, .5 + 0.0, -.5], colour: colours.dark_red, normal: [0.0, 1.0, 0.0] },
    { vertex: [.5, .5 + 0.0, -.5], colour: colours.dark_red, normal: [0.0, 1.0, 0.0] },
    { vertex: [-.5, .5 + 0.0, .5], colour: colours.dark_red, normal: [0.0, 1.0, 0.0] },
    { vertex: [.5, .5 + 0.0, .5], colour: colours.dark_red, normal: [0.0, 1.0, 0.0] }, // top face 4 - 7
    { vertex: [-.5, -.5, -.5 + -.0], colour: colours.orange, normal: [0.0, 0.0, 1.0] },
    { vertex: [.5, -.5, -.5 + -.0], colour: colours.orange, normal: [0.0, 0.0, 1.0] },
    { vertex: [-.5, .5, -.5 + -.0], colour: colours.orange, normal: [0.0, 0.0, 1.0] },
    { vertex: [.5, .5, -.5 + -.0], colour: colours.orange, normal: [0.0, 0.0, 1.0] }, // front face 8 - 11
    { vertex: [-.5, -.5, .5 + .0], colour: colours.pink, normal: [0.0, 0.0, -1.0] },
    { vertex: [.5, -.5, .5 + .0], colour: colours.pink, normal: [0.0, 0.0, -1.0] },
    { vertex: [-.5, .5, .5 + .0], colour: colours.pink, normal: [0.0, 0.0, -1.0] },
    { vertex: [.5, .5, .5 + .0], colour: colours.pink, normal: [0.0, 0.0, -1.0] }, // back face 12 - 15
    { vertex: [-.5 - .0, -.5, -.5], colour: colours.salmon, normal: [-1.0, 0.0, 0.0] },
    { vertex: [-.5 - .0, -.5, .5], colour: colours.salmon, normal: [-1.0, 0.0, 0.0] },
    { vertex: [-.5 - .0, .5, -.5], colour: colours.salmon, normal: [-1.0, 0.0, 0.0] },
    { vertex: [-.5 - .0, .5, .5], colour: colours.salmon, normal: [-1.0, 0.0, 0.0] }, // left face 16 - 19
    { vertex: [.5 + .0, -.5, -.5], colour: colours.salmon, normal: [1.0, 0.0, 0.0] },
    { vertex: [.5 + .0, -.5, .5], colour: colours.salmon, normal: [1.0, 0.0, 0.0] },
    { vertex: [.5 + .0, .5, -.5], colour: colours.salmon, normal: [1.0, 0.0, 0.0] },
    { vertex: [.5 + .0, .5, .5], colour: colours.salmon, normal: [1.0, 0.0, 0.0] }, // right face
];

export const cubeTriangles: Triangle[] = [
    [2, 0, 1],
    [1, 3, 2], // bottom
    [16, 17, 18],
    [17, 18, 19], // left
    [20, 21, 22],
    [21, 22, 23], // right
    [6, 4, 5],
    [5, 7, 6], // top
    [8, 9, 10],
    [9, 10, 11], // front
    [12, 13, 14],
    [13, 14, 15], // back
];

export function moveCubesFrame(renderer: Renderer) {
    // bare bones test for rotation with quaternions
    renderer.objects.forEach((obj, i) => {
        // obj.rotation = quatMul(obj.rotation, axisAngleToQuat([rand(0, 1), rand(0, 1), rand(0, 1), toRad(1)]));
        // if (i % 5 == 0)
        //     obj.rotation = quatMul(obj.rotation, axisAngleToQuat([1, 0, 0, toRad(1)]));
        // const dir = quatToAxisAngle(obj.rotation);

        // vec3.add(obj.position, obj.position, vec3.scale(vec3.create(), vec3.fromValues(dir[0], dir[1], dir[2]), obj.speed));
        obj.position[2] += 0.1;

        if (obj.position[2] > 20)
            obj.position[2] -= 220;
    });

    renderer.updateModelViewMatrices();
}

export function generateCubeObjects()
{
    const cubes = [];
    const size = 50;

    for (let i = 0; i < 10000; i++) {
        cubes.push({
            triangles: cubeTriangles,
            vertices: cubeVertices,
            // position: vec3.fromValues(rand(-size * 2, size * 2), rand(-size, size), rand(-30, -size * 5)),
            position: vec3.fromValues(rand(-size, size), rand(-size, size), rand(-30, -size * 5)),
            rotation: axisAngleToQuat(vec4.fromValues(0, 0, 1, toRad(180))),
            scale: /*rand(0, 10) < 1 ? vec3.fromValues(1, rand(5, 10), rand(2, 5)): */vec3.fromValues(1, 1, 10)
        });
    }

    return cubes;
}