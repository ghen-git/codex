import { fragmentShader } from "./shaders/meshes_3d/fragment";
import { vertexShader } from "./shaders/meshes_3d/vertex";
import { ShaderProgram3D } from "../shader_program_3d";
import { ShaderProgram } from "../shader_program";
import { vec3 } from "gl-matrix";
import { Camera } from "../codex_renderer";

export class Meshes3DProgram {
    static program3d: ShaderProgram3D;

    public static create(window: Window, camera: Camera) {
        const shaderProgram3d = new ShaderProgram3D(window, {
            vertexShaderSource: vertexShader,
            fragmentShaderSource: fragmentShader,
            customBuffers: {
                init: this.initBuffers,
                write: this.writeBuffers
            },
            workOnBuffers: (program, gl) => {
                program.renderer.processAntialiasing(program.renderer.savedBuffers[0].frameBuffer);
                gl.bindFramebuffer(gl.FRAMEBUFFER, program.renderer.multisampleFrameBuffer);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        }, 10, camera);

        Meshes3DProgram.program3d = shaderProgram3d;

        return shaderProgram3d.shaderProgram;
    }

    static initBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {
        const innerProgram = program.renderingData.program;

        const normalBuffer = gl.createBuffer();
        program.renderingData.attrs.normal = gl.getAttribLocation(innerProgram, "aNormal");
        program.renderingData.vertexBuffers.normal = normalBuffer;
    }

    static writeBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {
        // vertex buffers
        if (program.updateVertexBuffers) {
            const normals: number[] = [];

            program.meshes.forEach((mesh) => mesh.vertices.forEach(vertex => {
                if (vertex.data!.normal !== undefined) {
                    normals.push(...vertex.data!.normal);
                }
                else {
                    normals.push(...vec3.fromValues(0, 1, 0));
                }
            }));

            const normalAttr = program.renderingData.attrs.normal;
            const normalBuffer = program.renderingData.vertexBuffers.normal;

            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
            gl.vertexAttribPointer(normalAttr, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(normalAttr);
        }
    }
}