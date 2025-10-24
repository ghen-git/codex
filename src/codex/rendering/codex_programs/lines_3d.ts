import { fragmentShader } from "./shaders/lines_3d/fragment";
import { vertexShader } from "./shaders/lines_3d/vertex";
import { ShaderProgram3D } from "../shader_program_3d";
import { ShaderProgram } from "../shader_program";

export class Lines3DProgram {
    static program3d: ShaderProgram3D;

    public static create(window: Window) {
        const shaderProgram3d = new ShaderProgram3D(window, {
            vertexShaderSource: vertexShader,
            fragmentShaderSource: fragmentShader,
            customBuffers: {
                init: this.initBuffers,
                write: this.writeBuffers
            }
        }, 11);

        Lines3DProgram.program3d = shaderProgram3d;

        return shaderProgram3d.shaderProgram;
    }

    static initBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {
        const innerProgram = program.renderingData.program;

        // previousPoint
        const previousPointBuffer = gl.createBuffer();
        program.renderingData.attrs.previousPoint = gl.getAttribLocation(innerProgram, "aPreviousPoint");
        program.renderingData.vertexBuffers.previousPoint = previousPointBuffer;

        // nextPoint
        const nextPointBuffer = gl.createBuffer();
        program.renderingData.attrs.nextPoint = gl.getAttribLocation(innerProgram, "aNextPoint");
        program.renderingData.vertexBuffers.nextPoint = nextPointBuffer;

        // normalDir
        const normalDirBuffer = gl.createBuffer();
        program.renderingData.attrs.normalDir = gl.getAttribLocation(innerProgram, "aNormalDir");
        program.renderingData.vertexBuffers.normalDir = normalDirBuffer;

    }

    static writeBuffers(program: ShaderProgram, gl: WebGL2RenderingContext) {
        if(program.updateVertexBuffers) {
            const previousPoints: number[] = [], nextPoints: number[] = [], normalDirs: number[] = [];
    
            program.meshes.forEach((mesh) => mesh.vertices.forEach(vertex => {
                previousPoints.push(...vertex.data!.previousPoint);
                nextPoints.push(...vertex.data!.nextPoint);
                normalDirs.push(vertex.data!.normalDir);
            }));
    
            // previousPoint
            const previousPointAttr = program.renderingData.attrs.previousPoint;
            const previousPointBuffer = program.renderingData.vertexBuffers.previousPoint;
    
            gl.bindBuffer(gl.ARRAY_BUFFER, previousPointBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(previousPoints), gl.STATIC_DRAW);
            gl.vertexAttribPointer(previousPointAttr, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(previousPointAttr);
    
            // nextPoint
            const nextPointAttr = program.renderingData.attrs.nextPoint;
            const nextPointBuffer = program.renderingData.vertexBuffers.nextPoint;
    
            gl.bindBuffer(gl.ARRAY_BUFFER, nextPointBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nextPoints), gl.STATIC_DRAW);
            gl.vertexAttribPointer(nextPointAttr, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(nextPointAttr);
            
            // normalDir
            const normalDirAttr = program.renderingData.attrs.normalDir;
            const normalDirBuffer = program.renderingData.vertexBuffers.normalDir;
    
            gl.bindBuffer(gl.ARRAY_BUFFER, normalDirBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalDirs), gl.STATIC_DRAW);
            gl.vertexAttribPointer(normalDirAttr, 1, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(normalDirAttr);
        }
    }
}