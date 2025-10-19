import { mat4, vec3, vec4 } from "gl-matrix"
import { LinkedList, LinkedListNode } from "../linked_list"
import { createProjectionMatrix } from "../math"


export interface RenderableMesh {
    triangles: Triangle[],
    vertices: Vertex[],
    listReference?: LinkedListNode<RenderableMesh>,
    data?: { [id: string]: any }
}

export type Triangle = vec3

export interface Vertex {
    position: vec3,
    data?: { [id: string]: any }
}

export interface RenderingData {
    program: WebGLProgram,
    projection: mat4,
    attrs: { [id: string]: GLint },
    uniforms: { [id: string]: WebGLUniformLocation | null },
    textures: { [id: string]: WebGLTexture | null },
    vertexBuffers: { [id: string]: WebGLBuffer | null },
    indexBuffer: WebGLBuffer,
    indicesCount: number,
    vao: WebGLVertexArrayObject
}

export interface ShaderProgramSettings {
    vertexShaderSource: string,
    fragmentShaderSource: string,
    frame?: (program: ShaderProgram, deltaTime: number) => void,
    setBlendingOptions?: (gl: WebGL2RenderingContext) => void,
    projectionMatrix?: mat4,
    customBuffers?: AdditionalBuffers,
    manualDrawCalls?: (program: ShaderProgram, gl: WebGL2RenderingContext) => void,
    onWindowResized?: (program: ShaderProgram, gl: WebGL2RenderingContext, newWidth: number, newHeight: number) => void,
}

export interface AdditionalBuffers {
    init: (program: ShaderProgram, gl: WebGL2RenderingContext) => void
    write: (program: ShaderProgram, gl: WebGL2RenderingContext) => void
}


/**
 * i'm grouping draw calls in something i'm calling "shader program". Each shader program
 * has its own vertex and fragment shader, collection of meshes to render, and custom
 * vertex buffers, uniforms and textures
 */
export class ShaderProgram {
    public gl: WebGL2RenderingContext;
    private window: Window;
    // @ts-expect-error
    public renderingData: RenderingData;
    public meshes: LinkedList<RenderableMesh>;
    settings: ShaderProgramSettings;
    shouldUpdateBuffers: boolean = false;

    private lastFrameTime: number;

    constructor(window: Window, settings: ShaderProgramSettings) {
        this.window = window;
        this.meshes = new LinkedList();
        this.settings = settings;
        // @ts-expect-error
        this.gl = undefined;
        this.lastFrameTime = Date.now();
    }

    /**
     * setup for the draw call (and the loop that re-renders the scene every frame)
     */
    setup(gl: WebGL2RenderingContext) {
        this.gl = gl;

        const program = this.createShaderProgram();

        const positionBuffer = this.gl.createBuffer();
        const indexBuffer = this.gl.createBuffer();
        if (indexBuffer == null) {
            console.error('unable to initialize indexBuffer');
            return;
        }

        const projectionMatrix = this.settings.projectionMatrix ?
            this.settings.projectionMatrix :
            createProjectionMatrix(this.window.innerWidth, this.window.innerHeight, 70, 0.01, 100000);

        this.renderingData = {
            program: program,
            projection: projectionMatrix,
            attrs: {
                position: this.gl.getAttribLocation(program, "aPosition")
            },
            uniforms: {
                projectionMat: this.gl.getUniformLocation(program, "uProjectionMatrix"),
                viewportRatio: this.gl.getUniformLocation(program, "uViewportRatio"),
            },
            textures: {},
            vertexBuffers: {
                position: positionBuffer
            },
            indexBuffer: indexBuffer,
            indicesCount: 0,
            vao: this.gl.createVertexArray()!
        }

        this.gl.useProgram(program);

        if (this.settings.customBuffers !== undefined)
            this.settings.customBuffers.init(this, this.gl);

        // needs to be called everytime the meshes change
        this.writeBuffers();

        this.gl.uniformMatrix4fv(this.renderingData.uniforms.projectionMat, false, this.renderingData.projection);
        this.gl.uniform1f(this.renderingData.uniforms.viewportRatio, this.window.innerWidth / this.window.innerHeight);
    }

    renderMesh(mesh: RenderableMesh) {
        const node = this.meshes.push(mesh);
        mesh.listReference = node;
        this.shouldUpdateBuffers = true;
    }

    removeMesh(mesh: RenderableMesh) {
        this.meshes.remove(mesh.listReference!);
        this.shouldUpdateBuffers = true;
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
        this.gl.useProgram(this.renderingData.program);

        if (this.settings.setBlendingOptions)
            this.settings.setBlendingOptions(this.gl);

        const frameTime = Date.now();
        const deltaTime = frameTime - this.lastFrameTime;

        if (this.settings.frame)
            this.settings.frame(this, deltaTime);

        this.lastFrameTime = frameTime;

        if (this.shouldUpdateBuffers) {
            this.writeBuffers();
            this.shouldUpdateBuffers = false;
        }

        this.gl.bindVertexArray(this.renderingData.vao);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.renderingData.indexBuffer); // binds indices buffer

        if (this.settings.manualDrawCalls !== undefined) {
            this.settings.manualDrawCalls(this, this.gl);
        }
        else {
            // tells the GPU to draw all the meshes
            this.drawTriangles(this.renderingData.indicesCount, 0);
        }
    }

    /**
     * Utility to draw the triangles in a frame after the program has been set up
     * @param count the number of triangles to draw
     * @param offset the starting index to start reading triangle information from
     */
    drawTriangles(count: number, offset: number) {
        this.gl.drawElements(this.gl.TRIANGLES, count, this.gl.UNSIGNED_INT, offset);
    }

    /**
     * rewrites the mesh data to the GPU
     */
    writeBuffers() {
        const positions: number[] = [];
        const indices: number[] = [];

        let triangleIndexOffset = 0;

        // translates each mesh into an array of vertex positions
        this.meshes.forEach((mesh) => {
            mesh.vertices.forEach(vertex => {
                const pos = vertex.position;
                positions.push(...vec4.fromValues(pos[0], pos[1], pos[2], 1));
            });

            mesh.triangles.forEach(triangle => {
                triangle.forEach(vertexIndex => {
                    indices.push(vertexIndex + triangleIndexOffset);
                });
            });

            triangleIndexOffset += mesh.vertices.length;
        });

        this.renderingData.indicesCount = indices.length;

        this.gl.bindVertexArray(this.renderingData.vao);
        // updates the buffers and uniforms
        this.writePositionBuffer(positions);
        this.writeIndexBuffer(indices);

        if (this.settings.customBuffers !== undefined)
            this.settings.customBuffers.write(this, this.gl);
    }

    /**
     * writes a list of vertex positions that will be read by the vertexPosition attribute of the
     * vertex shader
     */
    writePositionBuffer(positions: number[]) {
        const positionBuffer = this.renderingData.vertexBuffers.position;
        const positionAttr = this.renderingData.attrs.position;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(positionAttr, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(positionAttr);
    }


    /**
     * writes the list of indices on the index buffer.
     */
    writeIndexBuffer(indices: number[]) {
        const indexBuffer = this.renderingData.indexBuffer;

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), this.gl.STATIC_DRAW);
    }

    public updateWindowSize(newWidth: number, newHeight: number) {
        this.gl.bindVertexArray(this.renderingData.vao);
        this.gl.uniform1f(this.renderingData.uniforms.viewportRatio, newWidth / newHeight);

        if (this.settings.onWindowResized)
            this.settings.onWindowResized(this, this.gl, newWidth, newHeight);
    }
}