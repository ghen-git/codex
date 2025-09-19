import { ShaderProgram } from "../shader_program";
import { vertexShader } from "./shaders/vfx_circles_2d/vertex";
import { fragmentShader } from "./shaders/vfx_circles_2d/fragment";
import { createProjectionMatrix2d } from "../../math";

export class VfxCircles2DProgram {
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
        const radiusBuffer = gl.createBuffer();
        const uvBuffer = gl.createBuffer();

        program.renderingData.attrs.colour = gl.getAttribLocation(innerProgram, "aColour");
        program.renderingData.vertexBuffers.colour = colourBuffer;

        program.renderingData.attrs.radius = gl.getAttribLocation(innerProgram, "aRadius");
        program.renderingData.vertexBuffers.radius = radiusBuffer;

        program.renderingData.attrs.uv = gl.getAttribLocation(innerProgram, "aUV");
        program.renderingData.vertexBuffers.uv = uvBuffer;
    }

    static writeBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {
        const colours: number[] = []; 
        const radiuses: number[] = [];
        const uvs: number[] = [];

        program.meshes.forEach(mesh => mesh.vertices.forEach(vertex => {
            colours.push(...vertex.data!.colour);
            radiuses.push(vertex.data!.radius);
            uvs.push(...vertex.data!.uv);
        }));

        const colourAttr = program.renderingData.attrs.colour;
        const colourBuffer = program.renderingData.vertexBuffers.colour;

        const radiusAttr = program.renderingData.attrs.radius;
        const radiusBuffer = program.renderingData.vertexBuffers.radius;

        const uvAttr = program.renderingData.attrs.uv;
        const uvBuffer = program.renderingData.vertexBuffers.uv;

        gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW);
        gl.vertexAttribPointer(colourAttr, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colourAttr);

        gl.bindBuffer(gl.ARRAY_BUFFER, radiusBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(radiuses), gl.STATIC_DRAW);
        gl.vertexAttribPointer(radiusAttr, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(radiusAttr);

        gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
        gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(uvAttr);
    }
}