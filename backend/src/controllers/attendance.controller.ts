import { Router, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { createAttendanceSchema } from '../utils/validation';

export class AttendanceController {
  public router: Router;

  constructor(
    private attendanceService: AttendanceService,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.use(this.authMiddleware.authenticate);

    this.router.post('/', this.recordCheckIn);
    this.router.get('/today', this.getTodayCheckIns);
    this.router.get('/today/count', this.getTodayCount);
    this.router.get('/member/:memberId', this.getByMemberId);
  }

  private recordCheckIn = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createAttendanceSchema.parse(req.body);
      const attendance = await this.attendanceService.recordCheckIn(validated);
      res.status(201).json({ success: true, data: attendance });
    } catch (error) {
      next(error);
    }
  };

  private getTodayCheckIns = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const checkIns = await this.attendanceService.getTodayCheckIns();
      res.json({ success: true, data: checkIns });
    } catch (error) {
      next(error);
    }
  };

  private getTodayCount = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await this.attendanceService.getTodayCount();
      res.json({ success: true, data: count });
    } catch (error) {
      next(error);
    }
  };

  private getByMemberId = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const checkIns = await this.attendanceService.getCheckInsByMemberId(req.params.memberId as string);
      res.json({ success: true, data: checkIns });
    } catch (error) {
      next(error);
    }
  };
}
