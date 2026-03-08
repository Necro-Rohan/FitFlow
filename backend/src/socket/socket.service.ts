import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config';

export class SocketService {
  private io: SocketIOServer | null = null;

  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupEventHandlers();
    console.log('Socket.IO server initialized');
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('register_role', (data: { role: string; userId: string }) => {
        socket.join(`role_${data.role}`);
        socket.join(`user_${data.userId}`);
      });

      socket.on('ping_server', () => {
        socket.emit('pong_server', { timestamp: new Date().toISOString() });
      });

      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id} (${reason})`);
      });
    });
  }

  emitToAll(event: string, data: any): void {
    if (!this.io) {
      console.warn('Socket.IO not initialized, event skipped:', event);
      return;
    }
    this.io.emit(event, data);
  }

  emitToRole(role: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`role_${role}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`user_${userId}`).emit(event, data);
  }

  getConnectionCount(): number {
    if (!this.io) return 0;
    return this.io.engine.clientsCount;
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}
