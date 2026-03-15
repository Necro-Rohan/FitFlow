import { createServer } from 'http';
import { App } from './app';
import { SocketService } from './socket/socket.service';
import { config } from './config';

async function bootstrap(): Promise<void> {
  console.log('FitFlow server starting...');

  const socketService = new SocketService();
  const appInstance = new App(socketService);
  const httpServer = createServer(appInstance.app);

  socketService.initialize(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`CORS origin: ${config.corsOrigin}`);
  });

  // graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down...`);
    await appInstance.shutdown();
    httpServer.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
