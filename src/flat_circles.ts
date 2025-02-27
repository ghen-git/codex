import { DrawCall } from "./renderer";

export function initAdditionalBuffers(drawCall: DrawCall, gl: WebGL2RenderingContext) {
    const uvBuffer = gl.createBuffer();

    const program = drawCall.renderingData!.program;
    drawCall.renderingData!.shaderAttrs.uvAttr = gl.getAttribLocation(program, "aUV");
    drawCall.renderingData!.uvBuffer = uvBuffer;
}

export function writeToAdditionalBuffers(drawCall: DrawCall, gl: WebGL2RenderingContext) {
    const uvs: number[] = [];

    drawCall.objects.forEach(obj => obj.vertices.forEach(vertex => {
        uvs.push(...vertex.additional!.uv);
    }));

    const uvAttr = drawCall.renderingData!.shaderAttrs.uvAttr;
    const uvBuffer = drawCall.renderingData!.uvBuffer;

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(uvAttr);
}