import { IdkBuffer, Connection } from "./socket_connection";
import { WebSocket } from "ws";

export class ReceiverConnection extends Connection {
    public isOpen: boolean;

    constructor(socket: WebSocket) {
        super(socket);
        this.isOpen = true;
        socket.on('close', () => {
            this.isOpen = false;
            console.log('R: closed receiver connection');
        });
    }

    public sendToClient(data: IdkBuffer) {
        if (this.isOpen)
            this.socket.send(data);
    }
}