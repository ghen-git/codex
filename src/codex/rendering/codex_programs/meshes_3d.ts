import { mat4, vec3 } from "gl-matrix";
import { createProjectionMatrix, quaternionToRotationMatrix } from "../../math";
import { ShaderProgram } from "../shader_program";
import { fragmentShader } from "./shaders/meshes_3d/fragment";
import { vertexShader } from "./shaders/meshes_3d/vertex";

export class Meshes3DProgram {
    static cameraPosition: vec3 = [0, 0, 0];

    public static create(window: Window) {
        return new ShaderProgram(
            window,
            {
                vertexShaderSource: vertexShader,
                fragmentShaderSource: fragmentShader,
                projectionMatrix: createProjectionMatrix(window.innerWidth, window.innerHeight, 70, 0.01, 10000),
                customBuffers: {
                    init: this.initBuffers,
                    write: this.writeBuffers
                },
                setBlendingOptions: (gl) => {
                    // 2d with alpha "blending"
                    gl.depthFunc(gl.LEQUAL); // sets the comparison to see if an object's z is closer than another to <=
                    gl.enable(gl.DEPTH_TEST); // activates depth testing (closer triangles get rendered on top of further ones)
                },
                onWindowResized: this.updateProjectionMatrix
            }
        )
    }

    public static moveCameraBy(offset: vec3) {
        vec3.add(Meshes3DProgram.cameraPosition, Meshes3DProgram.cameraPosition, offset);
    }

    public static moveCameraTo(position: vec3) {
        Meshes3DProgram.cameraPosition = position;
    }

    static updateProjectionMatrix(program: ShaderProgram, gl: WebGL2RenderingContext, newWidth: number, newHeight: number) {
        program.renderingData.projection = createProjectionMatrix(newWidth, newHeight, 70, 0.01, 10000);
        gl.useProgram(program.renderingData.program);
        gl.uniformMatrix4fv(program.renderingData.uniforms.projectionMat, false, program.renderingData.projection);
    }

    static initBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {
        const innerProgram = program.renderingData.program;

        const colourBuffer = gl.createBuffer();
        program.renderingData.attrs.colour = gl.getAttribLocation(innerProgram, "aColour");
        program.renderingData.vertexBuffers.colour = colourBuffer;

        const modelViewMatrixIndexBuffer = gl.createBuffer();
        program.renderingData.attrs.modelViewMatrixIndex = gl.getAttribLocation(innerProgram, "aModelViewMatrixIndex");
        program.renderingData.vertexBuffers.modelViewMatrixIndex = modelViewMatrixIndexBuffer;
        

        const modelViewMatricesTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, modelViewMatricesTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        program.renderingData.uniforms.modelViewMatricesTexture = gl.getUniformLocation(program.renderingData.program, "uModelViewMatricesTexture");
        program.renderingData.textures.modelViewMatrices = modelViewMatricesTexture;

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(program.renderingData!.uniforms.modelViewMatricesTexture, 0);
    }

    static writeBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {
        const colours: number[] = [], modelViewMatrixIndices: number[] = [];

        program.meshes.forEach((mesh, meshIndex) => mesh.vertices.forEach(vertex => {
            colours.push(...vertex.data!.colour);
            modelViewMatrixIndices.push(meshIndex);
        }));

        const colourAttr = program.renderingData.attrs.colour;
        const colourBuffer = program.renderingData.vertexBuffers.colour;

        gl.bindBuffer(gl.ARRAY_BUFFER, colourBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colours), gl.STATIC_DRAW);
        gl.vertexAttribPointer(colourAttr, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colourAttr);

        const modelViewMatrixIndexAttr = program.renderingData.attrs.modelViewMatrixIndex;
        const modelViewMatrixIndexBuffer = program.renderingData.vertexBuffers.modelViewMatrixIndex;

        gl.bindBuffer(gl.ARRAY_BUFFER, modelViewMatrixIndexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelViewMatrixIndices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(modelViewMatrixIndexAttr, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(modelViewMatrixIndexAttr);
        const matricesBuffer: number[] = [];

        program.meshes.forEach(mesh => {
            const modelViewMat = mat4.create();

            const translationMat = mat4.fromValues(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                mesh.data!.position[0] - Meshes3DProgram.cameraPosition[0], mesh.data!.position[1] - Meshes3DProgram.cameraPosition[1], mesh.data!.position[2] - Meshes3DProgram.cameraPosition[2], 1,
            );

            const rotationMat = quaternionToRotationMatrix(mesh.data!.rotation);

            mat4.mul(modelViewMat, modelViewMat, translationMat);
            mat4.mul(modelViewMat, modelViewMat, rotationMat);

            matricesBuffer.push(...modelViewMat);
        });

        gl.bindTexture(gl.TEXTURE_2D, program.renderingData.textures.modelViewMatrices);
        const width = 4;
        const height = matricesBuffer.length / (width * 4);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, new Float32Array(matricesBuffer));
    }
}