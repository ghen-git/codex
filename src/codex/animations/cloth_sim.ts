import { vec2, vec4 } from "gl-matrix";
import { lerpVec2, normalize, randomOrderArray, vecFrom2Points } from "../../math_ops";
import { Line, LineEnding } from "../lines";

const gravity = 0.005;
const iterations = 15;

export class ClothSim {
    points: Point[];
    seams: Seam[];
    order: number[];

    constructor(points: Point[], seams: Seam[]) {
        this.points = points;
        this.seams = seams;
        this.order = randomOrderArray(this.seams.length);
    }

    simulationFrame(deltaTime: number) {
        for(let i = 0; i < this.points.length; i++) {
            if(this.points[i].locked)
                continue;

            const prevPos = this.points[i].pos;
            const movement = vec2.sub(vec2.create(), this.points[i].pos, this.points[i].lastPos);

            this.points[i].pos = vec2.add(vec2.create(), this.points[i].pos, movement);
            this.points[i].pos = vec2.add(vec2.create(), this.points[i].pos, [0, gravity * deltaTime * deltaTime]);
            this.points[i].lastPos = prevPos;
        }
        for(let i = 0; i < iterations; i++) {
            for(let j = 0; j < this.seams.length; j++) {
                const seam = this.seams[this.order[j]];

                const dir = normalize(vecFrom2Points(seam.a.pos, seam.b.pos));
                const centre = lerpVec2(seam.a.pos, seam.b.pos, 0.5);

                if(!seam.a.locked)
                    seam.a.pos = vec2.add(vec2.create(), centre, vec2.scale(vec2.create(), dir, -seam.length*0.5));
                if(!seam.b.locked)
                    seam.b.pos = vec2.add(vec2.create(), centre, vec2.scale(vec2.create(), dir, seam.length*0.5));

                if(i == iterations - 1)
                    seam.updateLine();
            }
        }
    }
}

export class Point {
    pos: vec2;
    lastPos: vec2;
    locked: boolean;

    constructor(pos: vec2, locked: boolean) {
        this.pos = pos;
        this.locked = locked;
        this.lastPos = pos;
    }
}

export class Seam {
    a: Point;
    b: Point;
    length: number;
    line: Line;

    constructor(a: Point, b: Point) {
        this.a = a;
        this.b = b;
        this.length = vec2.dist(a.pos, b.pos);
        this.line = new Line(a.pos, b.pos, LineEnding.ROUND, vec4.fromValues(0, 0, 0, 0), 8, 0, 0);
    }

    updateLine() {
        this.line.a = this.a.pos;
        this.line.b = this.b.pos;
    }
}