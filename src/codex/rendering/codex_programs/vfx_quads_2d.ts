import { ShaderProgram } from "../shader_program";
import { vertexShader } from "./shaders/vfx_quads_2d/vertex";
import { fragmentShader } from "./shaders/vfx_quads_2d/fragment";
import { createProjectionMatrix2d } from "../../math";

export class VfxQuads2DProgram {
    public static create(window: Window) {
        return new ShaderProgram(
            window,
            {
                vertexShaderSource: vertexShader,
                fragmentShaderSource: fragmentShader,
                projectionMatrix: createProjectionMatrix2d(window.innerWidth, window.innerHeight),
                customBuffers: {
                    init: this.initBuffers,
                    write: this.writeBuffers
                },
                setBlendingOptions: (gl) => { 
                    // 2d with alpha "blending"
                    gl.enable(gl.BLEND);
                    gl.blendFunc(gl.ONE, gl.ONE);
                    gl.blendEquation(gl.MAX);
                }
            }
        )
    }

    static initBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {
        const innerProgram = program.renderingData.program;

        const colourBuffer = gl.createBuffer();
        program.renderingData.attrs.colour = gl.getAttribLocation(innerProgram, "aColour");
        program.renderingData.vertexBuffers.colour = colourBuffer;
    }

    static writeBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {
        const colours: number[] = [];
    
        program.meshes.forEach(mesh => mesh.vertices.forEach(vertex => {
            colours.push(...vertex.data!.colour);
        }));
    
        const colourAttr = program.renderingData.attrs.colour;
        const colourBuffer = program.renderingData.vertexBuffers.colour;
    
        gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW);
        gl.vertexAttribPointer(colourAttr, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colourAttr);
    }
}