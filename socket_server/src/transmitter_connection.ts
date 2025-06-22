import { ReceiverConnection } from "./reciever_connection";
import { IdkBuffer, Connection } from "./socket_connection";
import { WebSocket } from "ws";

export class TransmitterConnection extends Connection {
    receiverConnection: ReceiverConnection;

    constructor(socket: WebSocket, receiverConnection: ReceiverConnection) {
        super(socket);
        this.receiverConnection = receiverConnection;
        socket.on('close', () => {
            console.log('T: closed transmitter connection');    
        });
    }

    override onMessage(data: IdkBuffer): void {
        this.receiverConnection.sendToClient(data.toString());
    }
}