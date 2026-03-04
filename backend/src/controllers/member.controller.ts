import { Router, Response, NextFunction } from 'express';
import { MemberService } from '../services/member.service';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { createMemberSchema, updateMemberSchema } from '../utils/validation';

export class MemberController {
  public router: Router;

  constructor(
    private memberService: MemberService,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.use(this.authMiddleware.authenticate);

    this.router.post('/', this.create);
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);
    this.router.get('/qr/:qrCode', this.getByQrCode);
    this.router.put('/:id', this.update);
    this.router.delete('/:id', this.remove);
  }

  private create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createMemberSchema.parse(req.body);
      const member = await this.memberService.createMember(validated, req.userId!);
      res.status(201).json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  };

  private getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, assignedTrainerId } = req.query;
      const members = await this.memberService.getAllMembers({
        status: status as string,
        assignedTrainerId: assignedTrainerId as string,
      });
      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  };

  private getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const member = await this.memberService.getMemberById(req.params.id as string);
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  };

  private getByQrCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const member = await this.memberService.getMemberByQrCode(req.params.qrCode as string);
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  };

  private update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = updateMemberSchema.parse(req.body);
      const member = await this.memberService.updateMember(req.params.id as string, validated, req.userId!);
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  };

  private remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.memberService.deleteMember(req.params.id as string, req.userId!);
      res.json({ success: true, message: 'Member deleted.' });
    } catch (error) {
      next(error);
    }
  };
}
