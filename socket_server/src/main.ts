import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { setup } from './socket_server';

const httpServer = createServer();
const socketServer = new WebSocketServer({ server: httpServer });
setup(socketServer);

httpServer.listen(8400, () => {
  console.log('Listening on', httpServer.address());
});