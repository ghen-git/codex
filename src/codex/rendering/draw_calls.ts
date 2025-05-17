import { rgbToScreenSpace, createProjectionMatrix2d } from '../../math_ops';
import { BlendFunction, DrawCall } from './renderer';
import * as FlatCircles from './flat_circles';
import { vertexShader as lineQuadsVertex } from '../../shaders/2d_flat_quads/vertex';
import { fragmentShader as lineQuadsFragment } from '../../shaders/2d_flat_quads/fragment';
import { vertexShader as lineCirclesVertex } from '../../shaders/2d_flat_circles/vertex';
import { fragmentShader as lineCirclesFragment } from '../../shaders/2d_flat_circles/fragment';

export let flatQuadsDrawCall: DrawCall;
export let flatCirclesDrawCall: DrawCall;

export function setupDrawCalls() {
    flatQuadsDrawCall = new DrawCall(window, {
        backgroundColour: rgbToScreenSpace(17, 17, 17),
        vertexShaderSource: lineQuadsVertex,
        fragmentShaderSource: lineQuadsFragment,
        projectionMatrix: createProjectionMatrix2d(),
    }, BlendFunction.NORMAL);

    flatCirclesDrawCall = new DrawCall(window, {
        backgroundColour: rgbToScreenSpace(17, 17, 17),
        vertexShaderSource: lineCirclesVertex,
        fragmentShaderSource: lineCirclesFragment,
        projectionMatrix: createProjectionMatrix2d(),
        additionalShaderData: {
            initBuffers: FlatCircles.initAdditionalBuffers,
            writeToBuffers: FlatCircles.writeToAdditionalBuffers
        }
    }, BlendFunction.PRESERVE_ALPHA);
}