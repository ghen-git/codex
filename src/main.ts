import './style.css';
import { stringToHTML } from './modules/util';
import { init, Renderer } from './renderer';
import { vertexShader } from './shaders/3d_rendering/vertex';
import { fragmentShader } from './shaders/3d_rendering/fragment';
import { axisAngleToQuat, quatMul, quatToAxisAngle, rand, rgbToScreenSpace, toRad } from './math_ops';
import { cubeTriangles, cubeVertices } from './cubecode';
import { quat, vec3, vec4 } from 'gl-matrix';

let canvas: HTMLCanvasElement;
let renderer: Renderer;

document.addEventListener('DOMContentLoaded', () => {
    canvas = stringToHTML(`<canvas></canvas>`) as HTMLCanvasElement;
    document.body.appendChild(canvas);
    resizeCanvas();

    renderer = init(canvas, window, {
        backgroundColour: rgbToScreenSpace(17, 17, 17),
        vertexShaderSource: vertexShader,
        fragmentShaderSource: fragmentShader,
        frame: (renderer) => {
            // bare bones test for rotation with quaternions
            renderer.objects.forEach((obj, i) => {
                // obj.rotation = quatMul(obj.rotation, axisAngleToQuat([rand(0, 1), rand(0, 1), rand(0, 1), toRad(1)]));
                // if (i % 5 == 0)
                //     obj.rotation = quatMul(obj.rotation, axisAngleToQuat([1, 0, 0, toRad(1)]));
                // const dir = quatToAxisAngle(obj.rotation);

                // vec3.add(obj.position, obj.position, vec3.scale(vec3.create(), vec3.fromValues(dir[0], dir[1], dir[2]), obj.speed));
                obj.position[2] += 0.1;

                if (obj.position[2] > 20)
                    obj.position[2] -= 220;
            });

            renderer.updateModelViewMatrices();
        }
    })!;

    const size = 50;
    for (let i = 0; i < 10000; i++) {
        renderer.objects.push({
            triangles: cubeTriangles,
            vertices: cubeVertices,
            // position: vec3.fromValues(rand(-size * 2, size * 2), rand(-size, size), rand(-30, -size * 5)),
            position: vec3.fromValues(rand(-size, size), rand(-size, size), rand(-30, -size * 5)),
            rotation: axisAngleToQuat(vec4.fromValues(0, 0, 1, toRad(180))),
            scale: /*rand(0, 10) < 1 ? vec3.fromValues(1, rand(5, 10), rand(2, 5)): */vec3.fromValues(1, 1, 10)
        });
    }

    renderer.start();
});

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}