import { fragmentShader } from "./shaders/downsample_blur/fragment";
import { vertexShader } from "./shaders/downsample_blur/vertex";
import { ShaderProgram } from "../shader_program";

export class DownsampleBlurProgram {
    static program: ShaderProgram;

    public static UPDOWNSCALE_COUNT = 6;
    public static UPDOWNSCALE_TEXTURE_START = 16;

    public static create(window: Window) {
        this.program = new ShaderProgram(window, {
            vertexShaderSource: vertexShader,
            fragmentShaderSource: fragmentShader,
            manualDrawCalls: this.drawCall,
            customBuffers: {
                init: this.initBuffers,
                write: this.writeBuffers
            },
            onWindowResized: (program) => {
                program.renderer.updateTexturesSize(program.renderingData.savedBuffers);
            }
        });

        this.program.forceFrame = true;
        this.program.drawToCanvas = false;

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

        program.renderingData.uniforms.texture = gl.getUniformLocation(program.renderingData.program, "uTexture");
        program.renderingData.uniforms.texelSize = gl.getUniformLocation(program.renderingData.program, "uTexelSize");

        gl.uniform2fv(program.renderingData.uniforms.texelSize, [program.window.innerWidth, program.window.innerHeight]);

        const renderer = program.renderer;

        for (let i = 0; i < DownsampleBlurProgram.UPDOWNSCALE_COUNT; i++) {
            program.renderingData.savedBuffers.push(renderer.createSavedBuffer(DownsampleBlurProgram.UPDOWNSCALE_TEXTURE_START + i, Math.pow(2, i + 1)));
        }
    }

    static writeBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {

    }

    static drawCall(program: ShaderProgram, gl: WebGL2RenderingContext) {
        for (let i = 0; i < DownsampleBlurProgram.UPDOWNSCALE_COUNT; i++) {
            if (i == 0)
                gl.uniform1i(program.renderingData!.uniforms.texture, 1);
            else
                gl.uniform1i(program.renderingData!.uniforms.texture, DownsampleBlurProgram.UPDOWNSCALE_TEXTURE_START + i - 1);

            gl.bindFramebuffer(gl.FRAMEBUFFER, program.renderingData.savedBuffers[i].frameBuffer);
            gl.viewport(0, 0,
                Math.ceil(program.window.innerWidth * (1 / program.renderingData.savedBuffers[i].downscalingFactor)),
                Math.ceil(program.window.innerHeight * (1 / program.renderingData.savedBuffers[i].downscalingFactor))
            );
            gl.uniform2fv(
                program.renderingData.uniforms.texelSize,
                [
                    1 / (program.window.innerWidth * (1 / program.renderingData.savedBuffers[i].downscalingFactor)),
                    1 / (program.window.innerHeight * (1 / program.renderingData.savedBuffers[i].downscalingFactor))
                ]
            );
            gl.clear(gl.COLOR_BUFFER_BIT);
            program.drawTriangles(6, 0);
        }

        gl.viewport(0, 0, program.window.innerWidth, program.window.innerHeight);
    }
}