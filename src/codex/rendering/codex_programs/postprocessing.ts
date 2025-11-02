import { fragmentShader } from "./shaders/postprocessing/fragment";
import { vertexShader } from "./shaders/postprocessing/vertex";
import { ShaderProgram } from "../shader_program";
import { DownsampleBlurProgram } from "./downsample_blur";

export class PostProcessingProgram {
    static program: ShaderProgram;

    public static create(window: Window) {
        this.program = new ShaderProgram(window, {
            vertexShaderSource: vertexShader,
            fragmentShaderSource: fragmentShader,
            manualDrawCalls: this.drawCall,
            customBuffers: {
                init: this.initBuffers,
                write: () => {}
            }
        });

        this.program.forceFrame = true;
        this.program.drawToCanvas = true;

        return this.program;
    }

    static initBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {
        gl.bindVertexArray(program.renderingData.vao);
        const innerProgram = program.renderingData.program;

        const positions: number[] = [-1, -1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, 1, 1, 0, 1];
        const uvs: number[] = [0, 0, 1, 0, 0, 1, 1, 1];
        const indices: number[] = [0, 1, 2, 1, 3, 2];

        program.renderingData.verticesCount = 4;
        program.renderingData.indicesCount = 6;

        program.writePositionBuffer(positions);
        program.writeIndexBuffer(indices);

        const uvBuffer = gl.createBuffer();
        program.renderingData.attrs.uv = gl.getAttribLocation(innerProgram, "aUv");
        program.renderingData.vertexBuffers.uv = uvBuffer;

        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
        gl.vertexAttribPointer(program.renderingData.attrs.uv, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(program.renderingData.attrs.uv);
        
        program.renderingData.uniforms.frameBufferTexture = gl.getUniformLocation(program.renderingData.program, "uFrameBufferTexture");
        program.renderingData.uniforms.emissiveTexture = gl.getUniformLocation(program.renderingData.program, "uEmissiveTexture");
        gl.uniform1i(program.renderingData!.uniforms.frameBufferTexture, 0);
        gl.uniform1i(program.renderingData!.uniforms.emissiveTexture, DownsampleBlurProgram.UPDOWNSCALE_TEXTURE_START + DownsampleBlurProgram.UPDOWNSCALE_COUNT * 2 - 1);
    }

    static drawCall(program: ShaderProgram) {
        program.drawTriangles(6, 0);
    }
}