import { vec3, vec4 } from "gl-matrix";
import { RenderableMesh } from "../shader_program";

export enum PolylineType {
    NATIVE,
    MESH,
    GPU,
}

export interface Polyline {
    points: vec3[],
    colour: vec4,
    thickness: number,
    mesh: RenderableMesh
    changePoints: (newPoints: vec3[]) => void
}