// import { OrderedWorkerPool } from '../workers/ordered_worker_pool';
// import DetectionWorker from './workers/detection_worker?worker'
import { HandLandmarker, FilesetResolver, HandLandmarkerResult } from '@mediapipe/tasks-vision'
import { HandsFast } from './hand_processing/hand_types';
import { LandmarkerResultFormatter } from './hand_processing/mediapipe_serializer';

export class MediapipeTracker {
    // workerPool: OrderedWorkerPool;
    handEventHandler: (data: HandsFast, zImproved: boolean) => void;
    landmarker: HandLandmarker;
    lastFrame: number;
    video?: HTMLVideoElement;
    window: Window;
    running: boolean;
    lastHandsFromZCamera?: HandsFast;
    receivedZEnhancement: boolean;
    blockUntilZEnhanced: boolean;

    constructor(handEventHandler: (data: HandsFast, zImproved: boolean) => void, landmarker: HandLandmarker, window: Window, blockUntilZEnhanced: boolean/*, nWorkers: number*/) {
        this.handEventHandler = handEventHandler;
        this.landmarker = landmarker;
        this.lastFrame = -1;
        this.window = window;
        this.running = false;
        this.receivedZEnhancement = false;
        this.blockUntilZEnhanced = blockUntilZEnhanced;

        // this.workerPool = new OrderedWorkerPool(nWorkers, DetectionWorker);
    }

    public static async create(handEventHandler: (data: HandsFast, zImproved: boolean) => void, window: Window, blockUntilZEnhanced: boolean = false) {
        const landmarker = await this.createLandmarker();
        const tracker = new MediapipeTracker(handEventHandler, landmarker, window, blockUntilZEnhanced);

        await tracker.setupVideoStream(window);

        return tracker;
    }

    processLandmarks(result: HandLandmarkerResult) {
        try {
            const hands = LandmarkerResultFormatter.format(result, false, true);

            if (this.receivedZEnhancement && this.lastHandsFromZCamera) {
                LandmarkerResultFormatter.improveZ(hands, this.lastHandsFromZCamera);
            }

            this.handEventHandler(hands, this.receivedZEnhancement);
            this.receivedZEnhancement = false;
        }
        catch (ex) {
            console.warn(ex);
        }
    }

    setupVideoStream(window: Window) {
        this.video = window.document.getElementById('webcam_displayer') as HTMLVideoElement;
        const video = this.video;

        const constraints = {
            video: true
        };

        return new Promise<void>(resolve => {
            try {
                window.navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
                    video.srcObject = stream;
                    video.addEventListener('loadeddata', () => {
                        this.accessWebcamFrame();
                        resolve();
                    });
                })
            } catch (e) {
                alert(e);
            }
        });
    }

    processWebcamFrame() {
        const startTimeMs = this.window.performance.now();
        const results = this.landmarker.detectForVideo(this.video!, startTimeMs);

        if (!this.blockUntilZEnhanced || this.receivedZEnhancement)
            this.processLandmarks(results);
    }

    accessWebcamFrame() {
        if (!this.video || !this.running)
            return;

        if (this.lastFrame !== this.video.currentTime) {
            this.lastFrame = this.video.currentTime;
            this.processWebcamFrame();
        }

        window.requestAnimationFrame(() => this.accessWebcamFrame());
    }

    public start() {
        this.running = true;
        window.requestAnimationFrame(() => this.accessWebcamFrame());
    }

    public stop() {
        this.running = false;
    }

    public updateZCameraHands(hands: HandsFast) {
        this.lastHandsFromZCamera = hands;
        this.receivedZEnhancement = true;
    }

    static async createLandmarker() {
        const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm');
        return await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandPresenceConfidence: 0.3,
            minHandDetectionConfidence: 0.3,
            minTrackingConfidence: 0.3
        });
    };

    // processFrame(frame: any): Promise<any> {
    //     return this.workerPool.process(frame);
    // }
}