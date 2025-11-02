import { fragmentShader } from "./shaders/meshes_3d_emissive/fragment";
import { vertexShader } from "./shaders/meshes_3d_emissive/vertex";
import { ShaderProgram3D } from "../shader_program_3d";

export class Meshes3DEmissiveProgram {
    static program3d: ShaderProgram3D;

    public static create(window: Window) {
        const shaderProgram3d = new ShaderProgram3D(window, {
            vertexShaderSource: vertexShader,
            fragmentShaderSource: fragmentShader,
            workOnBuffers: (program, gl) => {
                program.renderer.processAntialiasing(program.renderer.savedBuffers[1].frameBuffer);
                gl.bindFramebuffer(gl.FRAMEBUFFER, program.renderer.multisampleFrameBuffer);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        }, 13);


        Meshes3DEmissiveProgram.program3d = shaderProgram3d;

        return shaderProgram3d.shaderProgram;
    }
}