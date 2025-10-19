import { fragmentShader } from "./shaders/lines_3d/fragment";
import { vertexShader } from "./shaders/lines_3d/vertex";
import { ShaderProgram3D } from "../shader_program_3d";

export class Lines3DProgram {
    public static create(window: Window) {
        const shaderProgram3d = new ShaderProgram3D(window, {
            vertexShaderSource: vertexShader,
            fragmentShaderSource: fragmentShader
        });

        return shaderProgram3d.shaderProgram;
    }
}