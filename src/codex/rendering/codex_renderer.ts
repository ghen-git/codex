import { mat4, quat, vec3 } from "gl-matrix";
import { DownsampleBlurProgram } from "./codex_programs/downsample_blur";
import { Lines3DProgram } from "./codex_programs/lines_3d";
import { Meshes3DProgram } from "./codex_programs/meshes_3d";
import { Meshes3DEmissiveProgram } from "./codex_programs/meshes_3d_emissive";
import { NativeLinesProgram } from "./codex_programs/native_lines";
import { PostProcessingProgram } from "./codex_programs/postprocessing";
import { UpsampleBlurProgram } from "./codex_programs/upsample_blur";
import { Renderer } from "./renderer";
import { ShaderProgram } from "./shader_program";

export interface Camera {
    position: vec3,
    rotation: quat,
    rotationMat: mat4
}

export class CodexRenderer {
    public static meshes3DProgram: ShaderProgram;
    public static meshes3DEmissiveProgram: ShaderProgram;
    public static lines3DProgram: ShaderProgram;
    public static nativeLinesProgram: ShaderProgram;
    public static downsampleBlurProgram: ShaderProgram;
    public static upsampleBlurProgram: ShaderProgram;
    public static postProcessingProgram: ShaderProgram;
    public static camera: Camera;

    public static start(window: Window) {
        CodexRenderer.camera = {
            position: vec3.fromValues(0, 0, 0),
            rotation: quat.create(),
            rotationMat: mat4.create()
        };

        CodexRenderer.meshes3DProgram = Meshes3DProgram.create(window, CodexRenderer.camera);
        CodexRenderer.meshes3DEmissiveProgram = Meshes3DEmissiveProgram.create(window, CodexRenderer.camera);
        CodexRenderer.lines3DProgram = Lines3DProgram.create(window, CodexRenderer.camera);
        CodexRenderer.nativeLinesProgram = NativeLinesProgram.create(window, CodexRenderer.camera);
        CodexRenderer.downsampleBlurProgram = DownsampleBlurProgram.create(window);
        CodexRenderer.upsampleBlurProgram = UpsampleBlurProgram.create(window);
        CodexRenderer.postProcessingProgram = PostProcessingProgram.create(window);

        const renderer = Renderer.create(window, [
            CodexRenderer.meshes3DProgram,
            CodexRenderer.lines3DProgram,
            CodexRenderer.nativeLinesProgram,
            CodexRenderer.meshes3DEmissiveProgram,
            CodexRenderer.downsampleBlurProgram,
            CodexRenderer.upsampleBlurProgram,
            CodexRenderer.postProcessingProgram,
        ]);

        renderer!.start();
    }

    public static updateCamera() {
        CodexRenderer.meshes3DProgram.updateAdditionalBuffers = true;
        CodexRenderer.lines3DProgram.updateAdditionalBuffers = true;
        CodexRenderer.nativeLinesProgram.updateAdditionalBuffers = true;
        CodexRenderer.meshes3DEmissiveProgram.updateAdditionalBuffers = true;
        
        CodexRenderer.meshes3DProgram.additionalBuffersToUpdate[0] = true;
        CodexRenderer.lines3DProgram.additionalBuffersToUpdate[0] = true;
        CodexRenderer.nativeLinesProgram.additionalBuffersToUpdate[0] = true;
        CodexRenderer.meshes3DEmissiveProgram.additionalBuffersToUpdate[0] = true;
    }

    public static updateVertexBuffers() {
        CodexRenderer.meshes3DProgram.updateVertexBuffers = true;
        CodexRenderer.lines3DProgram.updateVertexBuffers = true;
        CodexRenderer.nativeLinesProgram.updateVertexBuffers = true;
        CodexRenderer.meshes3DEmissiveProgram.updateVertexBuffers = true;
        CodexRenderer.downsampleBlurProgram.updateVertexBuffers = true;
        CodexRenderer.upsampleBlurProgram.updateVertexBuffers = true;
        CodexRenderer.postProcessingProgram.updateVertexBuffers = true;
    }

    public static updateModelBuffers() {
        CodexRenderer.meshes3DProgram.updateModelBuffers = true;
        CodexRenderer.lines3DProgram.updateModelBuffers = true;
        CodexRenderer.nativeLinesProgram.updateModelBuffers = true;
        CodexRenderer.meshes3DEmissiveProgram.updateModelBuffers = true;
        CodexRenderer.downsampleBlurProgram.updateModelBuffers = true;
        CodexRenderer.upsampleBlurProgram.updateModelBuffers = true;
        CodexRenderer.postProcessingProgram.updateModelBuffers = true;
    }
}