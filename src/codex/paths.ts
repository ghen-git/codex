import { vec2, vec4 } from "gl-matrix";
import { CubicBezier } from "./beziers";
import { LineEnding } from "./lines";

export class BezierPath {
    beziers: CubicBezier[];
    colour: vec4;
    thickness: number;
    ends: LineEnding;

    private _startT: number;
    public get startT(): number {
        return this._startT;
    }
    public set startT(value: number) {
        this._startT = value;
        this.refreshBeziers();
    }

    private _endT: number;
    public get endT(): number {
        return this._endT;
    }
    public set endT(value: number) {
        this._endT = value;
        this.refreshBeziers();
    }
    
    constructor(colour: vec4, thickness: number, ends: LineEnding) {
        this.colour = colour;
        this.thickness = thickness;
        this.ends = ends;

        this.beziers = [];
        this._startT = 0.0;
        this._endT = 0.0;
    }

    setTBounds(startT: number, endT: number) {
        this._startT = startT;
        this._endT = endT;

        this.refreshBeziers();
    }

    addBezier(a: vec2, b: vec2, c: vec2, d: vec2) {
        const bezier = new CubicBezier(a, b, c, d, this.colour, this.thickness, this.ends);
        this.beziers.push(bezier);
    }

    refreshBeziers() {
        let bezierStartT = Math.floor(this._startT);
        let bezierEndT = Math.floor(this._endT);
        
        if(bezierEndT < bezierStartT) {
            bezierEndT += this.beziers.length;
        }
        const loopingEnd = bezierEndT % this.beziers.length;

        for(let i = 0; i < this.beziers.length; i++) {
            const offsetI = bezierStartT + i;
            const loopingI = offsetI % this.beziers.length;

            if(offsetI < bezierStartT) {
                this.beziers[loopingI].startT = 0.0;
                this.beziers[loopingI].endT = 0.0;
            }
            else if(offsetI > bezierEndT) {
                this.beziers[loopingI].startT = 0.0;
                this.beziers[loopingI].endT = 0.0;
            }
            else {
                this.beziers[loopingI].startT = 0.0;
                this.beziers[loopingI].endT = 1.0;
            }

            if(offsetI == bezierStartT) {
                this.beziers[loopingI].startT = this._startT % 1;
            }
            if(offsetI == bezierEndT) {
                this.beziers[loopingI].endT = this._endT % 1;
            }
        }
    }
}