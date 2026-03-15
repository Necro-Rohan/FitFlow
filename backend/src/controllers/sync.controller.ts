import { Router, Response, NextFunction } from 'express';
import { SyncService } from '../services/sync.service';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { syncBatchSchema } from '../utils/validation';

export class SyncController {
  public router: Router;

  constructor(
    private syncService: SyncService,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.use(this.authMiddleware.authenticate);

    this.router.get('/snapshot', this.getSnapshot);
    this.router.post('/batch', this.processBatch);
  }

  private processBatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = syncBatchSchema.parse(req.body);

      console.log(`Sync batch: ${validated.items.length} items from user ${req.userId}`);

      const result = await this.syncService.processBatch(validated, req.userId!);

      console.log(`Sync done: ${result.processed} ok, ${result.failed} failed`);

      // 207 if some items failed, so frontend knows which to retry
      const statusCode = result.failed > 0 ? 207 : 200;

      res.status(statusCode).json({
        success: result.failed === 0,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  private getSnapshot = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log(`Snapshot requested by user ${req.userId}`);
      const snapshot = await this.syncService.getSnapshot();
      res.json({ success: true, data: snapshot });
    } catch (error) {
      next(error);
    }
  };
}
