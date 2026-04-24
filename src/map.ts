import { vec2, vec3, vec4 } from "gl-matrix";
import { axisAngleToQuat, basisFromQuat, basisToRotationMat, quatMul, rand } from "./codex/math";
import { CodexRenderer } from "./codex/rendering/codex_renderer";
import { ShaderProgram } from "./codex/rendering/shader_program";
import { PolylineNative } from "./codex/rendering/polylines/polyline_native";
import { WireframeNative } from "./codex/rendering/wireframes/wireframe_native";
import * as Lerc from "lerc";
//@ts-expect-error
import lercWasmURL from "../assets/wasm/lerc-wasm.wasm?url"

/**
 * map dimensions and how to find the tile x, y coordinate in wgs84 is in
 */

document.addEventListener('DOMContentLoaded', () => {
    CodexRenderer.start(window);

    document.addEventListener('mousemove', moveRotation);
    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
    });
    document.addEventListener('wheel', zoomEvent);

    renderObj();
});

const gridVertices: vec3[] = [
    [-0.5, 0, -0.5],
    [0.5, 0, -0.5],
    [0.5, 0, 0.5],
    [-0.5, 0, 0.5],
]

interface GridChunk {
    wireframe: WireframeNative
}

const gridChunks: GridChunk[] = [];

const chunkVerticesNumber = 256;
const squareSize = 0.5;
const heightScale = 0.001;
const tileSize = 256;
const gridColour: vec4 = [0.5, 1, 1, 1];
turnColourNeon(gridColour, 1)

async function renderObj() {
    CodexRenderer.nativeLinesProgram.settings.frame = frame;
    CodexRenderer.updateCamera();

    await Lerc.load({
        locateFile: () => lercWasmURL
    });

    const zoom = 1;

    for(let i = 0; i < zoom * 2; i++) {
        for(let j = 0; j < zoom * 2; j++) {
            loadTile(i, j, zoom);
        }
    }
}

async function loadTile(xIndex: number, yIndex: number, zoom: number) {
    const xOffset = xIndex * tileSize;
    const yOffset = yIndex * tileSize;

    const url = `https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer/tile/${zoom}/${yIndex}/${xIndex}`;

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const pixelBlock = Lerc.decode(arrayBuffer);

    const { height, width, pixels, mask } = pixelBlock;

    for (let sourceY = 0; sourceY < height; sourceY++) {
        for (let sourceX = 0; sourceX < width; sourceX++) {
            const pixelHeight = pixels[0][sourceY * width + sourceX];
            changeHeightAtPos((xOffset + sourceX), -(yOffset + sourceY), pixelHeight * heightScale);
        }
    }
}


function changeHeightAtPos(x: number, y: number, height: number) {
    const baseChunkX = Math.floor(x / (chunkVerticesNumber - 1));
    const baseChunkY = Math.floor(y / (chunkVerticesNumber - 1));

    let xInChunk = x % (chunkVerticesNumber - 1);
    let yInChunk = y % (chunkVerticesNumber - 1);

    // adjustment for the way the Javascript mod operator works (https://web.archive.org/web/20090717035140if_/javascript.about.com/od/problemsolving/a/modulobug.htm)
    if(x < 0)
        xInChunk = (xInChunk + (chunkVerticesNumber - 1)) % (chunkVerticesNumber - 1);
    if(y < 0)
        yInChunk = (yInChunk + (chunkVerticesNumber - 1)) % (chunkVerticesNumber - 1);

    changeHeightInChunk(baseChunkX, baseChunkY, xInChunk, yInChunk, height);

    if(xInChunk == chunkVerticesNumber - 1)
        changeHeightInChunk(baseChunkX + 1, baseChunkY, 0, yInChunk, height);
    if(yInChunk == chunkVerticesNumber - 1)
        changeHeightInChunk(baseChunkX, baseChunkY + 1, xInChunk, 0, height);

    if(xInChunk == 0)
        changeHeightInChunk(baseChunkX - 1, baseChunkY, chunkVerticesNumber - 1, yInChunk, height);
    if(yInChunk == 0)
        changeHeightInChunk(baseChunkX, baseChunkY - 1, xInChunk, chunkVerticesNumber - 1, height);

    if(xInChunk == chunkVerticesNumber - 1 && yInChunk == chunkVerticesNumber - 1)
        changeHeightInChunk(baseChunkX + 1, baseChunkY + 1, 0, 0, height);
    if(xInChunk == 0 && yInChunk == 0)
        changeHeightInChunk(baseChunkX - 1, baseChunkY - 1, chunkVerticesNumber - 1, chunkVerticesNumber - 1, height);
}

function changeHeightInChunk(chunkX: number, chunkY: number, x: number, y: number, height: number, createChunkIfNotPresent = true) {
    const chunkId = getChunkId(chunkX, chunkY);

    if(gridChunks[chunkId] === undefined) {
        if(!createChunkIfNotPresent)
            return;
        
        initChunk(chunkX, chunkY);
    }

    const chunk = gridChunks[chunkId];
    const vertices = chunk.wireframe.getVertices();

    
    vertices[y * chunkVerticesNumber + x][1] = height;
    chunk.wireframe.scheduleUpdate();
}

function initChunk(x: number, y: number) {
    const chunkOffsetX = x * (chunkVerticesNumber - 1) * squareSize;
    const chunkOffsetY = y * (chunkVerticesNumber - 1) * squareSize;

    const wireframe = buildChunkWireframe(chunkVerticesNumber, squareSize, gridColour);
    wireframe.mesh.data!.position = [chunkOffsetX, 0, chunkOffsetY];

    gridChunks[getChunkId(x, y)] = {
        wireframe: wireframe
    } as GridChunk;
}

function getChunkId(x: number, y: number) {
    // the max chunk value is equal to half of the signed 16 bit integer
    if (x > 16383 || y > 16383)
        return -1;

    // x gets stored on one side of a 32 bit integer and y on the other side
    return (x + 16383) + ((y + 16383) << 16);
}

function buildChunkWireframe(verticesNumber: number, squareSize: number, colour: vec4) {
    let startingPos = 0;

    let vertexPosZ = startingPos;
    const vertices: vec3[] = [];
    const lines: vec2[] = [];

    for (let z = 0; z < verticesNumber; z++) {
        let vertexPosX = startingPos;

        for (let x = 0; x < verticesNumber; x++) {
            // let y = Math.sin(i * 0.2) * 0.2 + Math.cos(j * 0.2) * 0.2;
            vertices.push([vertexPosX, 0, vertexPosZ]);
            vertexPosX += squareSize;

            if (z > 0)
                lines.push([verticesNumber * (z - 1) + x, verticesNumber * z + x]);

            if (x > 0)
                lines.push([verticesNumber * z + (x - 1), verticesNumber * z + x]);
        }
        vertexPosZ += squareSize;
    }

    const grid = new WireframeNative(vertices, lines, colour, true);
    return grid;
}

let cameraYaw = Math.PI;
let cameraPitch = 0;
const pivot = vec3.create();
let pivotDeltaX = 0;
let pivotDeltaZ = 0;
const zoomStrength = 0.05;
const movementStrength = 0.1;
let zoom = 10;


function moveRotation(event: MouseEvent) {
    if (event.buttons == 1) {
        cameraYaw += event.movementX * 0.01;
        cameraPitch -= event.movementY * 0.01;
    }
    if(event.buttons == 2) {
        pivotDeltaX += event.movementX * movementStrength;
        pivotDeltaZ += event.movementY * movementStrength;
    }
}

function zoomEvent(event: WheelEvent) {
    zoom += event.deltaY * zoomStrength;
}

function frame(_: ShaderProgram, deltaTime: number) {
    let cameraRotation = axisAngleToQuat([0, 1, 0, cameraYaw]);
    cameraRotation = quatMul(cameraRotation, axisAngleToQuat([1, 0, 0, cameraPitch]));

    const basis = basisFromQuat(cameraRotation);
    const cameraPosition = vec3.scale(vec3.create(), basis.forward, zoom);

    const pivotForward = vec3.normalize(vec3.create(), vec3.fromValues(basis.forward[0], 0, basis.forward[2]));
    const pivotRight = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), pivotForward, basis.up));
    vec3.add(pivot, pivot, vec3.scale(vec3.create(), pivotForward, -pivotDeltaZ));
    vec3.add(pivot, pivot, vec3.scale(vec3.create(), pivotRight, -pivotDeltaX));
    pivotDeltaX = 0;
    pivotDeltaZ = 0;

    vec3.add(cameraPosition, cameraPosition, pivot);

    CodexRenderer.camera.position = cameraPosition;
    CodexRenderer.camera.rotationMat = basisToRotationMat(basis);
    CodexRenderer.updateCamera();

    CodexRenderer.meshes3DEmissiveProgram.updateModelBuffers = true;
    CodexRenderer.nativeLinesProgram.updateModelBuffers = true;
}

function turnColourNeon(colour: vec4, intensity: number = 1.0) {
    if (colour[0] == 0)
        colour[0] = 0.1;
    if (colour[1] == 0)
        colour[1] = 0.1;
    if (colour[2] == 0)
        colour[2] = 0.1;

    colour[0] = colour[0] * 1.5 * intensity;
    colour[1] = colour[1] * 1.5 * intensity;
    colour[2] = colour[2] * 1.5 * intensity;
}