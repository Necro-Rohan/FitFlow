import express, { Application } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { config } from './config';

import { MemberRepository } from './repositories/member.repository';
import { MembershipRepository } from './repositories/membership.repository';
import { PaymentRepository } from './repositories/payment.repository';
import { AttendanceRepository } from './repositories/attendance.repository';
import { LeadRepository } from './repositories/lead.repository';
import { AuditLogRepository } from './repositories/audit-log.repository';

import { AuthService } from './services/auth.service';
import { MemberService } from './services/member.service';
import { MembershipService } from './services/membership.service';
import { PaymentService } from './services/payment.service';
import { AttendanceService } from './services/attendance.service';
import { LeadService } from './services/lead.service';
import { SyncService } from './services/sync.service';
import { SocketService } from './socket/socket.service';

import { AuthController } from './controllers/auth.controller';
import { MemberController } from './controllers/member.controller';
import { MembershipController } from './controllers/membership.controller';
import { PaymentController } from './controllers/payment.controller';
import { AttendanceController } from './controllers/attendance.controller';
import { LeadController } from './controllers/lead.controller';
import { SyncController } from './controllers/sync.controller';
import { AuditController } from './controllers/audit.controller';

import { AuthMiddleware } from './middleware/auth.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

export class App {
  public app: Application;
  public prisma: PrismaClient;

  constructor(private socketService: SocketService) {
    this.app = express();
    this.prisma = new PrismaClient();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(cors({
      origin: config.corsOrigin,
      credentials: true,
    }));

    // sync payloads can get big
    this.app.use(express.json({ limit: '10mb' }));

    this.app.use((req, _res, next) => {
      if (config.nodeEnv === 'development') {
        console.log(`${req.method} ${req.path}`);
      }
      next();
    });
  }

  private setupRoutes(): void {
    // Repositories
    const memberRepo = new MemberRepository(this.prisma);
    const membershipRepo = new MembershipRepository(this.prisma);
    const paymentRepo = new PaymentRepository(this.prisma);
    const attendanceRepo = new AttendanceRepository(this.prisma);
    const leadRepo = new LeadRepository(this.prisma);
    const auditRepo = new AuditLogRepository(this.prisma);

    // Services
    const authService = new AuthService(this.prisma);
    const memberService = new MemberService(memberRepo, auditRepo);
    const membershipService = new MembershipService(membershipRepo, memberRepo, auditRepo);
    const paymentService = new PaymentService(paymentRepo, memberRepo, auditRepo);
    const attendanceService = new AttendanceService(attendanceRepo, memberRepo);
    const leadService = new LeadService(leadRepo, auditRepo);
    const syncService = new SyncService(this.prisma, this.socketService);

    const authMiddleware = new AuthMiddleware(authService);

    // Controllers
    const authController = new AuthController(authService, authMiddleware);
    const memberController = new MemberController(memberService, authMiddleware);
    const membershipController = new MembershipController(membershipService, authMiddleware);
    const paymentController = new PaymentController(paymentService, authMiddleware);
    const attendanceController = new AttendanceController(attendanceService, authMiddleware);
    const leadController = new LeadController(leadService, authMiddleware);
    const syncController = new SyncController(syncService, authMiddleware);
    const auditController = new AuditController(auditRepo, authMiddleware);

    // Routes
    this.app.use('/api/auth', authController.router);
    this.app.use('/api/members', memberController.router);
    this.app.use('/api/memberships', membershipController.router);
    this.app.use('/api/payments', paymentController.router);
    this.app.use('/api/attendance', attendanceController.router);
    this.app.use('/api/leads', leadController.router);
    this.app.use('/api/sync', syncController.router);
    this.app.use('/api/audit', auditController.router);

    this.app.get('/api/health', (_req, res) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          socketConnections: this.socketService.getConnectionCount(),
        },
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  async shutdown(): Promise<void> {
    await this.prisma.$disconnect();
    console.log('Prisma disconnected');
  }
}
