import { WebSocket, WebSocketServer } from "ws";
import { Connection } from "./socket_connection";
import { ReceiverConnection } from "./reciever_connection";
import { TransmitterConnection } from "./transmitter_connection";

export function setup(server: WebSocketServer) {
    server.on('connection', handleConnection);
}

const awaitingReceivers: ReceiverConnection[] = [];
let transmitterResolve: (value: void | PromiseLike<void>) => void;

async function handleConnection(socket: WebSocket) {
    socket.on('error', console.error);

    switch (socket.protocol) {
        case 'transmitter':
            for (let i = awaitingReceivers.length - 1; i >= 0; i--) {
                const receiver = awaitingReceivers[i];

                if (!receiver.isOpen) {
                    awaitingReceivers.splice(i, 1);
                }
            }

            if (awaitingReceivers.length < 1) {
                console.log('T: waiting for receiver');
                await new Promise<void>(resolve => transmitterResolve = resolve);
                transmitterResolve = undefined;
                console.log('T: resolved');
            }

            new TransmitterConnection(socket, awaitingReceivers.pop());
            console.log('T: setup transmitter connection');
            break;
        case 'receiver':
            const receiver = new ReceiverConnection(socket);
            console.log('R: setup receiver connection');

            awaitingReceivers.push(receiver);
            if (transmitterResolve !== undefined) {
                console.log('R: transmitter no longer waiting');
                transmitterResolve();
            }
            break;
        default:
            console.log('connected to someone?');
            break;
    }
}