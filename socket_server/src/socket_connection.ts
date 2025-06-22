import { WebSocket } from "ws";
export type IdkBuffer = string;

export class Connection {
    socket: WebSocket;

    constructor(socket: WebSocket) {
        this.socket = socket;
        socket.on('message', (data: IdkBuffer) => this.onMessage(data));
    }

    onMessage(data: IdkBuffer) {
        // const parsed = JSON.parse(data);
        // console.log(parsed);
        // this.socket.send(parsed.ballSize + ' (lmao just the same message but the server responded with it)');
    }
}