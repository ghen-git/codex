import { mat4, quat, vec3, vec4 } from 'gl-matrix';
import { quaternionToRotationMatrix, rgbToScreenSpace, toRad } from './math_ops';

export interface Object {
    triangles: Triangle[],
    vertices: VertexData[],
    position: vec3,
    scale: vec3,
    rotation: quat
}

export type Triangle = vec3

export interface VertexData {
    vertex: vec3,
    colour: vec4,
    normal: vec3,
    additional?: {[id: string]: any}
}

export function init(canvas: HTMLCanvasElement, window: Window, settings: RendererSettings) {
    const gl = canvas.getContext('webgl2', {antialias: true});

    if (gl == null) {
        console.error('unable to initialize WebGL');
        return;
    }

    const renderer = new Renderer(gl, canvas, window, settings);

    return renderer;
}

function randInt(min: number, max: number) {
    return Math.random() * (max - min) + (min);
}

export interface RendererSettings {
    backgroundColour: vec4,
    vertexShaderSource: string,
    fragmentShaderSource: string,
    frame: (renderer: Renderer) => void,
    projectionMatrix?: mat4,
    additionalShaderData?: AdditionalShaderDataRegistering
}

export interface AdditionalShaderDataRegistering {
    initBuffers: (renderer: Renderer, gl: WebGL2RenderingContext) => void
    writeToBuffers: (renderer: Renderer, gl: WebGL2RenderingContext) => void
}

export class Renderer {
    public gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private window: Window;
    public renderingData?: { [id: string]: any };
    public objects: Object[];
    private settings: RendererSettings;

    constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, window: Window, settings: RendererSettings) {
        this.gl = gl;
        this.canvas = canvas;
        this.window = window;
        this.objects = [];
        this.settings = settings;
    }

    /**
     * starts the renderer (and the loop that re-renders the scene every frame)
     */
    start() {
        const bg = this.settings.backgroundColour;
        this.gl.clearColor(bg[0], bg[1], bg[2], 1); // sets the value for the colour buffer bit
        this.gl.depthFunc(this.gl.LEQUAL); // sets the comparison to see if an object's z is closer than another to <=
        this.gl.enable(this.gl.DEPTH_TEST); // activates depth testing (closer triangles get rendered on top of further ones)
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.BLEND);

        const program = this.createShaderProgram();

        const positionBuffer = this.gl.createBuffer();
        const colourBuffer = this.gl.createBuffer();
        const normalBuffer = this.gl.createBuffer();
        const indexBuffer = this.gl.createBuffer();
        const modelViewMatrixIndexBuffer = this.gl.createBuffer();

        const modelViewMatricesTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, modelViewMatricesTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);


        const projectionMatrix = this.settings.projectionMatrix ? this.settings.projectionMatrix : this.createProjectionMatrix(70, 0.01, 100000);

        this.renderingData = {
            program: program,
            projectionMat: projectionMatrix,
            shaderAttrs: {
                vertexPosition: this.gl.getAttribLocation(program, "aVertexPosition"),
                vertexColourAttr: this.gl.getAttribLocation(program, "aVertexColour"),
                vertexNormalAttr: this.gl.getAttribLocation(program, "aVertexNormal"),
                modelViewMatrixIndexAttr: this.gl.getAttribLocation(program, "aModelViewMatrixIndex")
            },
            shaderUniforms: {
                projectionMat: this.gl.getUniformLocation(program, "uProjectionMatrix"),
                modelViewMatricesTexture: this.gl.getUniformLocation(program, "uModelViewMatricesTexture")
            },
            shaderTextures: {
                modelViewMatricesTexture: modelViewMatricesTexture
            },
            positionBuffer: positionBuffer,
            colourBuffer: colourBuffer,
            normalBuffer: normalBuffer,
            indexBuffer: indexBuffer,
            modelViewMatrixIndexBuffer: modelViewMatrixIndexBuffer
        }

        if(this.settings.additionalShaderData !== undefined)
            this.settings.additionalShaderData.initBuffers(this, this.gl);

        this.gl.useProgram(program);
        // needs to be called everytime the meshes change
        this.writeObjectsToVertexBuffer();

        this.gl.bindTexture(this.gl.TEXTURE_2D, modelViewMatricesTexture);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.uniform1i(this.renderingData!.shaderUniforms.modelViewMatricesTexture, 0);
        this.gl.uniformMatrix4fv(this.renderingData!.shaderUniforms.projectionMat, false, this.renderingData!.projectionMat);
        this.updateModelViewMatrices();
        this.loopOnAnimationFrame();
    }

    /**
     * initializes the shader program
     */
    createShaderProgram(): WebGLProgram {
        const program = this.gl.createProgram()!;
        const vertex = this.compileShader(this.gl.VERTEX_SHADER, this.settings.vertexShaderSource);
        if (!this.gl.getShaderParameter(vertex, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(vertex));
        }
        const fragment = this.compileShader(this.gl.FRAGMENT_SHADER, this.settings.fragmentShaderSource);
        if (!this.gl.getShaderParameter(fragment, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(fragment));
        }

        this.gl.attachShader(program, vertex);
        this.gl.attachShader(program, fragment);
        this.gl.linkProgram(program);

        return program;
    }

    /** 
     * utility to compile a shader from its code as a string
     */
    compileShader(type: GLenum, code: string): WebGLShader {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, code);
        this.gl.compileShader(shader);

        return shader;
    }

    renderFrame() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) // clears buffers selected by a mask to a preset value

        this.settings.frame(this);

        // draw call
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.renderingData!.indexBuffer); // binds indices buffer
        this.gl.drawElements(this.gl.TRIANGLES, this.renderingData!.vertexIndices, this.gl.UNSIGNED_INT, 0);
    }

    updateModelViewMatrices() {
        if(this.objects.length == 0)
            return;

        const matricesBuffer: number[] = [];

        this.objects.forEach(obj => {
            const modelViewMat = mat4.create();

            const translationMat = mat4.fromValues(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                obj.position[0], obj.position[1], obj.position[2], 1,
            );
            const scaleMat = mat4.fromValues(
                obj.scale[0], 0, 0, 0,
                0, obj.scale[1], 0, 0,
                0, 0, obj.scale[2], 0,
                0, 0, 0, 1,
            );

            const rotationMat = quaternionToRotationMatrix(obj.rotation);

            mat4.mul(modelViewMat, modelViewMat, translationMat);
            mat4.mul(modelViewMat, modelViewMat, rotationMat);
            mat4.mul(modelViewMat, modelViewMat, scaleMat);

            matricesBuffer.push(...modelViewMat);
        });


        this.gl.bindTexture(this.gl.TEXTURE_2D, this.renderingData!.shaderTextures.modelViewMatricesTexture);
        
        const width = matricesBuffer.length / 16 > 4096 ? 4096 : matricesBuffer.length / 16;
        const height: number = matricesBuffer.length / (width * 4);

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, width, height, 0, this.gl.RGBA, this.gl.FLOAT, new Float32Array(matricesBuffer));
    }

    writeObjectsToVertexBuffer() {
        const positions: number[] = [];
        const colours: number[] = [];
        const indices: number[] = [];
        const modelViewMatrixIndices: number[] = [];

        let triangleIndexOffset = 0;

        // translates each object into an array of vertex positions and colours
        this.objects.forEach((obj, objectIndex) => {
            const vertexes: number[] = [];

            obj.vertices.forEach(data => {
                const vert = data.vertex;
                vertexes.push(...vec4.fromValues(vert[0], vert[1], vert[2], 1));
                modelViewMatrixIndices.push(objectIndex);
                colours.push(...data.colour);
            });
            obj.triangles.forEach(tri => {
                tri.forEach(vertexIndex => {
                    indices.push(vertexIndex + triangleIndexOffset);
                });
            });

            positions.push(...vertexes);
            triangleIndexOffset += obj.vertices.length;
        })

        this.renderingData!.vertexIndices = indices.length;

        // updates the buffers and uniforms
        this.writePositionBuffer(positions);
        this.writeColourBuffer(colours);
        this.writeIndexBuffer(indices);
        this.writeModelViewMatrixIndexBuffer(modelViewMatrixIndices);
        
        if(this.settings.additionalShaderData !== undefined)
            this.settings.additionalShaderData.writeToBuffers(this, this.gl);
    }

    /**
     * writes a list of vertex positions that will be read by the vertexPosition attribute of the
     * vertex shader
     */
    writePositionBuffer(positions: number[]) {
        const positionBuffer = this.renderingData!.positionBuffer;
        const vertexPositionAttr = this.renderingData!.shaderAttrs.vertexPositionAttr;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(vertexPositionAttr, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vertexPositionAttr);
    }

    /**
     * writes a list of vertex colours that will be read by the vertexColour attribute of the
     * vertex shader
     */
    writeColourBuffer(colours: number[]) {
        const colourBuffer = this.renderingData!.colourBuffer;
        const vertexColourAttr = this.renderingData!.shaderAttrs.vertexColourAttr;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colourBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colours), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(vertexColourAttr, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vertexColourAttr);
    }

    /**
     * writes a list of vertex colours that will be read by the vertexColour attribute of the
     * vertex shader
     */
    writeNormalBuffer(normals: number[]) {
        const normalBuffer = this.renderingData!.normalBuffer;
        const vertexNormalAttr = this.renderingData!.shaderAttrs.vertexNormalAttr;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(vertexNormalAttr, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vertexNormalAttr);
    }

    /**
     * writes a list of vertex indices that will be read by the vertexColour attribute of the
     * vertex shader
     */
    writeIndexBuffer(indices: number[]) {
        const indexBuffer = this.renderingData!.indexBuffer;

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), this.gl.STATIC_DRAW);
    }

    /**
     * writes a list of vertex colours that will be read by the vertexColour attribute of the
     * vertex shader
     */
    writeModelViewMatrixIndexBuffer(modelViewMatrixIndices: number[]) {

        const modelViewMatrixIndexBuffer = this.renderingData!.modelViewMatrixIndexBuffer;
        const modelViewMatrixIndexAttr = this.renderingData!.shaderAttrs.modelViewMatrixIndexAttr;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, modelViewMatrixIndexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(modelViewMatrixIndices), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(modelViewMatrixIndexAttr, 1, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(modelViewMatrixIndexAttr);
    }

    /**
     * adds a call to the renderframe function of this renderer to the animation frame
     */
    loopOnAnimationFrame() {
        this.window.requestAnimationFrame(() => {
            this.renderFrame();
            this.loopOnAnimationFrame();
        });
    }

    /**
     * calculates a projection matrix
     * @param fov the Field Of View, in degrees
     * @param near the near cutting plane
     * @param far the far cutting plane
     * @returns the world-to-camera view projection matrix
     */
    public createProjectionMatrix(fov: number, near: number, far: number) {
        const aspectRatio = this.window.innerWidth / this.window.innerHeight;

        const t = Math.tan(toRad(fov) / 2) * near;
        const b = -t;
        const r = aspectRatio * t;
        const l = -r;

        return mat4.fromValues(
            (2 * near) / (r - l), 0.0, 0, 0.0,
            0.0, (2 * near) / (t - b), 0, 0.0,
            (r + l) / (r - l), (t + b) / (t - b), -(far + near) / (far - near), -1,
            0.0, 0.0, -(2 * far * near) / (far - near), 0
        );
    }
}