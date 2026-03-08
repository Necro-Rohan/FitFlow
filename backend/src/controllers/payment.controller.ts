import { Router, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { createPaymentSchema } from '../utils/validation';

export class PaymentController {
  public router: Router;

  constructor(
    private paymentService: PaymentService,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.use(this.authMiddleware.authenticate);

    this.router.post('/', this.create);
    this.router.get('/member/:memberId', this.getByMemberId);
    this.router.get('/revenue/today', this.getTodayRevenue);
    this.router.get('/report', this.getReport);
    this.router.get('/:id', this.getById);
  }

  private create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createPaymentSchema.parse(req.body);
      const payment = await this.paymentService.createPayment(validated, req.userId!);
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  };

  private getByMemberId = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payments = await this.paymentService.getPaymentsByMemberId(req.params.memberId as string);
      res.json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  };

  private getTodayRevenue = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const revenue = await this.paymentService.getTodayRevenue();
      res.json({ success: true, data: revenue });
    } catch (error) {
      next(error);
    }
  };

  private getReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        res.status(400).json({ success: false, error: 'Both startDate and endDate are required.' });
        return;
      }
      const payments = await this.paymentService.getPaymentsByDateRange(startDate as string, endDate as string);
      res.json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  };

  private getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await this.paymentService.getPaymentById(req.params.id as string);
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  };
}
