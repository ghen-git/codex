import { Hands } from './hand_processing/hand_types';
import { UltraleapDataFormatter } from './hand_processing/ultraleap_serializer';

const WEBSOCKET_URL = 'ws://localhost:6437/v6.json'
const WEBSOCKET_PROTOCOL = 'ultraleap-protocol'

export class UltraleapTracker {
    handEventHandler: (data: Hands) => void;
    running: boolean;
    webSocket?: WebSocket;
    connectionResolve?: (value: void | PromiseLike<void>) => void;

    constructor(handEventHandler: (data: Hands) => void) {
        this.handEventHandler = handEventHandler;
        this.running = false;
    }

    public static async create(handEventHandler: (data: Hands) => void) {
        const tracker = new UltraleapTracker(handEventHandler);

        await tracker.setupConnection();

        return tracker;
    }

    processUltraleapFrame(frameData: any) {
        try {
            this.handEventHandler(UltraleapDataFormatter.format(frameData));
        }
        catch (ex) {
            console.warn(ex);
        }
    }

    async setupConnection() {
        this.webSocket = new WebSocket(WEBSOCKET_URL, WEBSOCKET_PROTOCOL);
        this.webSocket.onopen = () => this.onSocketOpen;
        this.webSocket.onerror = (e) => this.onSocketError(e);
        this.webSocket.onmessage = (e) => this.processSocketMessage(e);

        return new Promise<void>(resolve => this.connectionResolve = resolve);
    }

    processSocketMessage(ev: MessageEvent<any>) {
        const data = JSON.parse(ev.data);

        if (data.hands !== undefined)
            this.processUltraleapFrame(data);
    }

    onSocketOpen() {
        console.log("ULTRALEAP TRACKER: Connected to Ultraleap Socket");

        this.webSocket!.send(JSON.stringify({ focused: true }));
        this.webSocket!.send(JSON.stringify({ background: true }));
    }

    onSocketError(e: Event) {
        console.error("ULTRALEAP TRACKER: communication error with the Ultraleap Socket:", e)
    }

    public start() {
        this.running = true;
    }

    public stop() {
        this.webSocket!.close();
        this.running = false;
    }
}