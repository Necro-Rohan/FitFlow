import { Router, Response, NextFunction } from 'express';
import { MembershipService } from '../services/membership.service';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { createMembershipSchema, updateMembershipSchema } from '../utils/validation';

export class MembershipController {
  public router: Router;

  constructor(
    private membershipService: MembershipService,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.use(this.authMiddleware.authenticate);

    this.router.post('/', this.create);
    this.router.get('/member/:memberId', this.getByMemberId);
    this.router.get('/expiring', this.getExpiring);
    this.router.put('/:id', this.update);
    this.router.post('/:id/pause', this.pause);
    this.router.post('/:id/extend', this.extend);
    this.router.delete('/:id', this.remove);
  }

  private create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createMembershipSchema.parse(req.body);
      const membership = await this.membershipService.createMembership(validated, req.userId!);
      res.status(201).json({ success: true, data: membership });
    } catch (error) {
      next(error);
    }
  };

  private getByMemberId = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const memberships = await this.membershipService.getMembershipsByMemberId(req.params.memberId as string);
      res.json({ success: true, data: memberships });
    } catch (error) {
      next(error);
    }
  };

  private getExpiring = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const memberships = await this.membershipService.getExpiringSoon(days);
      res.json({ success: true, data: memberships });
    } catch (error) {
      next(error);
    }
  };

  private update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = updateMembershipSchema.parse(req.body);
      const membership = await this.membershipService.updateMembership(req.params.id as string, validated, req.userId!);
      res.json({ success: true, data: membership });
    } catch (error) {
      next(error);
    }
  };

  private pause = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.membershipService.pauseMembership(req.params.id as string, req.userId!);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  private extend = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { days } = req.body;
      if (!days || days <= 0) {
        res.status(400).json({ success: false, error: 'Provide a valid number of days to extend.' });
        return;
      }
      const membership = await this.membershipService.extendMembership(req.params.id as string, days, req.userId!);
      res.json({ success: true, data: membership });
    } catch (error) {
      next(error);
    }
  };

  private remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.membershipService.deleteMembership(req.params.id as string, req.userId!);
      res.json({ success: true, message: 'Membership deleted.' });
    } catch (error) {
      next(error);
    }
  };
}
