import { mat4, vec3 } from "gl-matrix";
import { AdditionalBuffers, ShaderProgram, ShaderProgramFrame, ShaderProgramSettings } from "./shader_program"
import { createProjectionMatrix, quaternionToRotationMatrix } from "../math";

export class ShaderProgram3D {
    public shaderProgram: ShaderProgram;
    public cameraPosition: vec3;
    private lightDirection: vec3;
    private customFrame?: ShaderProgramFrame;
    customBuffers: AdditionalBuffers | undefined;
    private textureIndex: number;

    constructor(window: Window, settings: ShaderProgramSettings, textureIndex: number) {
        this.customBuffers = settings.customBuffers;
        this.cameraPosition = [0, 0, 0];
        this.lightDirection = [0, 0, 0];
        this.textureIndex = textureIndex;

        this.customFrame = settings.frame;
        settings.frame = (program, dt) => this.frame(program, dt, this);

        settings.customBuffers = {
            init: (program, gl) => this.initBuffers(program, gl, this),
            write: (program, gl) => this.writeBuffers(program, gl, this)
        };

        settings.setBlendingOptions = (gl) => {
            gl.depthFunc(gl.LEQUAL); // sets the comparison to see if an object's z is closer than another to <=
            gl.enable(gl.DEPTH_TEST); // activates depth testing (closer triangles get rendered on top of further ones)

            // use for alpha blending instead of depth testing
            // gl.disable(gl.DEPTH_TEST);
            // gl.enable(gl.BLEND);
            // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }

        settings.onWindowResized = this.updateProjectionMatrix;

        this.shaderProgram = new ShaderProgram(window, settings)
    }

    frame(program: ShaderProgram, dt: number, program3d: ShaderProgram3D) {
        program.gl.bindTexture(program.gl.TEXTURE_2D, program.renderingData.textures.modelViewMatrices);

        if (program3d.customFrame)
            program3d.customFrame(program, dt);
    }

    public moveCameraBy(offset: vec3) {
        vec3.add(this.cameraPosition, this.cameraPosition, offset);
    }

    public moveCameraTo(position: vec3) {
        this.cameraPosition = position;
    }

    updateProjectionMatrix(program: ShaderProgram, gl: WebGL2RenderingContext, newWidth: number, newHeight: number) {
        program.renderingData.projection = createProjectionMatrix(newWidth, newHeight, 70, 0.01, 10000);
        gl.useProgram(program.renderingData.program);
        gl.uniformMatrix4fv(program.renderingData.uniforms.projectionMat, false, program.renderingData.projection);
    }

    initBuffers(program: ShaderProgram, gl: WebGL2RenderingContext, program3d: ShaderProgram3D) {
        const innerProgram = program.renderingData.program;

        const colourBuffer = gl.createBuffer();
        program.renderingData.attrs.colour = gl.getAttribLocation(innerProgram, "aColour");
        program.renderingData.vertexBuffers.colour = colourBuffer;

        const modelViewMatrixIndexBuffer = gl.createBuffer();
        program.renderingData.attrs.modelViewMatrixIndex = gl.getAttribLocation(innerProgram, "aModelViewMatrixIndex");
        program.renderingData.vertexBuffers.modelViewMatrixIndex = modelViewMatrixIndexBuffer;

        const modelViewMatricesTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + this.textureIndex);
        gl.bindTexture(gl.TEXTURE_2D, modelViewMatricesTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        program.renderingData.uniforms.modelViewMatricesTexture = gl.getUniformLocation(program.renderingData.program, "uModelViewMatricesTexture");
        program.renderingData.uniforms.lightDirection = gl.getUniformLocation(program.renderingData.program, "uLightDirection");

        program.renderingData.textures.modelViewMatrices = modelViewMatricesTexture;


        this.lightDirection = vec3.fromValues(-0.5, 1, -0.5);
        vec3.normalize(this.lightDirection, this.lightDirection);

        gl.uniform1i(program.renderingData!.uniforms.modelViewMatricesTexture, this.textureIndex);
        gl.uniform3f(program.renderingData!.uniforms.lightDirection, this.lightDirection[0], this.lightDirection[1], this.lightDirection[2]);

        if (program3d.customBuffers !== undefined)
            program3d.customBuffers.init(this.shaderProgram, this.shaderProgram.gl);
    }

    writeBuffers(program: ShaderProgram, gl: WebGL2RenderingContext, program3d: ShaderProgram3D) {
        // vertex buffers
        if (program.updateVertexBuffers) {
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
        }

        // model buffers
        if (program.updateModelBuffers) {
            const matricesBuffer: number[] = [];
            program.meshes.forEach(mesh => {
                const modelViewMat = mat4.create();

                const translationMat = mat4.fromValues(
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    mesh.data!.position[0] - program3d.cameraPosition[0], mesh.data!.position[1] - program3d.cameraPosition[1], mesh.data!.position[2] - program3d.cameraPosition[2], 1,
                );

                const rotationMat = quaternionToRotationMatrix(mesh.data!.rotation);

                mat4.mul(modelViewMat, modelViewMat, translationMat);
                mat4.mul(modelViewMat, modelViewMat, rotationMat);

                matricesBuffer.push(...modelViewMat);
            });

            gl.bindTexture(gl.TEXTURE_2D, program.renderingData.textures.modelViewMatrices);

            const width = 4 * Math.ceil(matricesBuffer.length / 4096);
            const height = matricesBuffer.length / (width * 4);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, new Float32Array(matricesBuffer));

            if (this.customBuffers !== undefined)
                this.customBuffers.write(this.shaderProgram, this.shaderProgram.gl);
        }
    }
}