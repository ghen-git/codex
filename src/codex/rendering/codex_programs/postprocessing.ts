import { fragmentShader } from "./shaders/postprocessing/fragment";
import { vertexShader } from "./shaders/postprocessing/vertex";
import { RenderableMesh, ShaderProgram } from "../shader_program";

export class PostProcessingProgram {
    static program: ShaderProgram;

    public static create(window: Window) {
        this.program = new ShaderProgram(window, {
            vertexShaderSource: vertexShader,
            fragmentShaderSource: fragmentShader,
            manualDrawCalls: this.drawCall,
            customBuffers: {
                init: this.initBuffers,
                write: this.writeBuffers
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
        gl.uniform1i(program.renderingData!.uniforms.frameBufferTexture, 0);
    }

    static writeBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {

    }

    static drawCall(program: ShaderProgram, gl: WebGL2RenderingContext) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, program.renderer.multisampleFrameBuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, program.renderer.antialiasedFrameBuffer);

        gl.clearBufferfv(gl.COLOR, 0, [1.0, 1.0, 1.0, 1.0]);

        gl.blitFramebuffer(0, 0, program.window.innerWidth, program.window.innerHeight,
            0, 0, program.window.innerWidth, program.window.innerHeight,
            gl.COLOR_BUFFER_BIT, gl.LINEAR);

        // render the top layer to the framebuffer as well
        gl.bindFramebuffer(gl.FRAMEBUFFER, program.renderer.multisampleFrameBuffer);

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, program.renderer.multisampleFrameBuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

        gl.clearBufferfv(gl.COLOR, 0, [1.0, 1.0, 1.0, 1.0]);
        gl.blitFramebuffer(0, 0, program.window.innerWidth, program.window.innerHeight,
            0, 0, program.window.innerWidth, program.window.innerHeight,
            gl.COLOR_BUFFER_BIT, gl.LINEAR);

        // render the cube with the texture we just rendered to
        gl.bindTexture(gl.TEXTURE_2D, program.renderingData.textures.frameBuffer);

        program.drawTriangles(6, 0);
    }
}