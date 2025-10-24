import { fragmentShader } from "./shaders/meshes_3d/fragment";
import { vertexShader } from "./shaders/meshes_3d/vertex";
import { ShaderProgram3D } from "../shader_program_3d";

export class Meshes3DProgram {
    static program3d: ShaderProgram3D;

    public static create(window: Window) {
        const shaderProgram3d = new ShaderProgram3D(window, {
            vertexShaderSource: vertexShader,
            fragmentShaderSource: fragmentShader
        }, 10);

        Meshes3DProgram.program3d = shaderProgram3d;

        return shaderProgram3d.shaderProgram;
    }
}