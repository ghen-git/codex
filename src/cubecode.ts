import { rgbToScreenSpace } from "./math_ops";
import { Triangle, VertexData } from "./renderer";

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
    { vertexIndexes: [2, 0, 1] },
    { vertexIndexes: [1, 3, 2] }, // bottom
    { vertexIndexes: [16, 17, 18] },
    { vertexIndexes: [17, 18, 19] }, // left
    { vertexIndexes: [20, 21, 22] },
    { vertexIndexes: [21, 22, 23] }, // right
    { vertexIndexes: [6, 4, 5] },
    { vertexIndexes: [5, 7, 6] }, // top
    { vertexIndexes: [8, 9, 10] },
    { vertexIndexes: [9, 10, 11] }, // front
    { vertexIndexes: [12, 13, 14] },
    { vertexIndexes: [13, 14, 15] }, // back
];