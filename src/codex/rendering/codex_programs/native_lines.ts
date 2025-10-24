import { fragmentShader } from "./shaders/native_lines/fragment";
import { vertexShader } from "./shaders/native_lines/vertex";
import { ShaderProgram3D } from "../shader_program_3d";
import { ShaderProgram } from "../shader_program";
import { vec2 } from "gl-matrix";

export class NativeLinesProgram {
    static program3d: ShaderProgram3D;

    public static create(window: Window) {
        const shaderProgram3d = new ShaderProgram3D(window, {
            vertexShaderSource: vertexShader,
            fragmentShaderSource: fragmentShader,
            manualDrawCalls: this.nativeLinesDrawCall,
            customBuffers: {
                init: this.initBuffers,
                write: this.writeBuffers
            }
        }, 12);

        NativeLinesProgram.program3d = shaderProgram3d;

        return shaderProgram3d.shaderProgram;
    }

    static initBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {
    }

    static writeBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {
        if (program.updateVertexBuffers) {
            const indices: number[] = [];

            let meshIndexOffset = 0;

            program.meshes.forEach((mesh) => {
                mesh.data!.lines.forEach((line: vec2) => {
                    indices.push(line[0] + meshIndexOffset, line[1] + meshIndexOffset);
                });

                meshIndexOffset += mesh.vertices.length;
            });

            const indexBuffer = program.renderingData.indexBuffer;

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

            program.renderingData.indicesCount = indices.length;
        }
    }

    static nativeLinesDrawCall(program: ShaderProgram, gl: WebGL2RenderingContext) {
        gl.drawElements(gl.LINES, program.renderingData.indicesCount, gl.UNSIGNED_INT, 0);
    }
}