import { Server } from 'socket.io';
import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator.js';
import { AgentRegistry } from '../agents/AgentRegistry.js';

export class WebSocketHandler {
  private io: Server;
  private orchestrator: AgentOrchestrator;

  constructor(io: Server, orchestrator: AgentOrchestrator) {
    this.io = io;
    this.orchestrator = orchestrator;
    this.setupHandlers();
    this.startBroadcasts();
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`📡 Client connected: ${socket.id}`);

      socket.on('create-task', async (data, callback) => {
        try {
          const task = await this.orchestrator.createTask(
            data.title,
            data.description,
            data.type,
            data.priority,
            data.input
          );
          callback?.({ success: true, task });
        } catch (error) {
          callback?.({ success: false, error: String(error) });
        }
      });

      socket.on('subscribe-agents', (_data, callback) => {
        socket.join('agents');
        callback?.({ success: true });
      });

      socket.on('subscribe-tasks', (_data, callback) => {
        socket.join('tasks');
        callback?.({ success: true });
      });

      socket.on('disconnect', () => {
        console.log(`📡 Client disconnected: ${socket.id}`);
      });
    });
  }

  private startBroadcasts(): void {
    setInterval(async () => {
      const stats = await this.orchestrator.getStats();
      this.io.to('agents').emit('stats', stats);
      this.io.to('tasks').emit('stats', stats);
    }, 5000);
  }

  emit(event: string, data: unknown): void {
    this.io.emit(event, data);
  }

  emitToRoom(room: string, event: string, data: unknown): void {
    this.io.to(room).emit(event, data);
  }
}