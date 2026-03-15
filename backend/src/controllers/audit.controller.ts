import { Router, Request, Response, NextFunction } from 'express';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class AuditController {
  public router: Router;

  constructor(
    private auditRepo: AuditLogRepository,
    private authMiddleware: AuthMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/', this.authMiddleware.authenticate, this.getAuditLogs);
  }

  private getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await this.auditRepo.findRecent(50);
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  };
}
