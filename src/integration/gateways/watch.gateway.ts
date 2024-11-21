import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Gateways } from 'src/core/base/gateways';
@WebSocketGateway({ namespace: Gateways.watch.Namespace, cors: { origin: '*' } })
export class WatchGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log('watch connected', client.id);
    const userId = client.handshake.query.user_id as string; // User ID passed as query parameter
    if (!userId) {
      client.disconnect(); // Disconnect if no userId is provided
      console.log('Client disconnected: Missing userId');
      return;
  }}

  handleDisconnect(client: any) {
    console.log(`watch disconnected ${client.id}`);
    // set the driver as offline
  }

  afterInit(server: any) {
    console.log(`Socket is live ${server.name}`);
  }

 newRequest(users:string[],data: any) {
    this.server.to(users).emit('new-request', data);
  }
}
