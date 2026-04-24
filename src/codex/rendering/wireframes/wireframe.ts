import { vec2, vec3, vec4 } from "gl-matrix";
import { RenderableMesh } from "../shader_program";

export interface Wireframe {
    vertices: vec3[],
    lines: vec2[],
    colour: vec4,
    thickness: number,
    mesh: RenderableMesh
}