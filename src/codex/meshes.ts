import { vec2, vec3, vec4 } from "gl-matrix";
import { Triangle, VertexData } from "./rendering/renderer";

export function createQuad2D(vertices: VertexData[], triangles: Triangle[], startQuadOffset: number, colours: vec4[], additional: { [id: string]: any }[]) {
    triangles.push([startQuadOffset, startQuadOffset + 1, startQuadOffset + 2]);
    triangles.push([startQuadOffset + 2, startQuadOffset + 3, startQuadOffset + 1]);

    vertices.push({ vertex: vec3.create(), colour: colours[0], normal: vec3.create(), additional: additional[0] });
    vertices.push({ vertex: vec3.create(), colour: colours[1], normal: vec3.create(), additional: additional[1] });
    vertices.push({ vertex: vec3.create(), colour: colours[2], normal: vec3.create(), additional: additional[2] });
    vertices.push({ vertex: vec3.create(), colour: colours[3], normal: vec3.create(), additional: additional[3] });
}

export function resizeQuad2D(topLeft: vec2, topRight: vec2, bottomLeft: vec2, bottomRight: vec2, vertices: VertexData[], offset: number) {
    vertices[offset + 0].vertex[0] = topLeft[0];
    vertices[offset + 0].vertex[1] = topLeft[1];
    vertices[offset + 1].vertex[0] = topRight[0];
    vertices[offset + 1].vertex[1] = topRight[1];
    vertices[offset + 2].vertex[0] = bottomLeft[0];
    vertices[offset + 2].vertex[1] = bottomLeft[1];
    vertices[offset + 3].vertex[0] = bottomRight[0];
    vertices[offset + 3].vertex[1] = bottomRight[1];
}