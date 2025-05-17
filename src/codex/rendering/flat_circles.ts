import { DrawCall } from "./renderer";

export function initAdditionalBuffers(drawCall: DrawCall, gl: WebGL2RenderingContext) {
    const uvBuffer = gl.createBuffer();
    const radiusBuffer = gl.createBuffer();

    const program = drawCall.renderingData!.program;
    drawCall.renderingData!.shaderAttrs.uvAttr = gl.getAttribLocation(program, "aUV");
    drawCall.renderingData!.shaderAttrs.radiusAttr = gl.getAttribLocation(program, "aRadius");
    drawCall.renderingData!.uvBuffer = uvBuffer;
    drawCall.renderingData!.radiusBuffer = radiusBuffer;
}

export function writeToAdditionalBuffers(drawCall: DrawCall, gl: WebGL2RenderingContext) {
    const uvs: number[] = [], radiuses: number[] = [];

    drawCall.objects.forEach(obj => obj.vertices.forEach(vertex => {
        uvs.push(...vertex.additional!.uv);
        radiuses.push(vertex.additional!.radius);
    }));

    const uvAttr = drawCall.renderingData!.shaderAttrs.uvAttr;
    const uvBuffer = drawCall.renderingData!.uvBuffer;
    const radiusAttr = drawCall.renderingData!.shaderAttrs.radiusAttr;
    const radiusBuffer = drawCall.renderingData!.radiusBuffer;

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
    gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(uvAttr);

    gl.bindBuffer(gl.ARRAY_BUFFER, radiusBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(radiuses), gl.STATIC_DRAW);
    gl.vertexAttribPointer(radiusAttr, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(radiusAttr);
}