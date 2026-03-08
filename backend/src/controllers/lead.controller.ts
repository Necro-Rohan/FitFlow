import { Router, Response, NextFunction } from 'express';
import { LeadService } from '../services/lead.service';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { createLeadSchema, updateLeadSchema } from '../utils/validation';

export class LeadController {
  public router: Router;

  constructor(
    private leadService: LeadService,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.use(this.authMiddleware.authenticate);

    this.router.post('/', this.create);
    this.router.get('/', this.getAll);
    this.router.get('/status/:status', this.getByStatus);
    this.router.put('/:id', this.update);
    this.router.post('/:id/convert', this.convert);
    this.router.delete('/:id', this.remove);
  }

  private create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createLeadSchema.parse(req.body);
      const lead = await this.leadService.captureInquiry(validated, req.userId!);
      res.status(201).json({ success: true, data: lead });
    } catch (error) {
      next(error);
    }
  };

  private getAll = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leads = await this.leadService.getAllLeads();
      res.json({ success: true, data: leads });
    } catch (error) {
      next(error);
    }
  };

  private getByStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leads = await this.leadService.getLeadsByStatus(req.params.status as string);
      res.json({ success: true, data: leads });
    } catch (error) {
      next(error);
    }
  };

  private update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = updateLeadSchema.parse(req.body);
      const lead = await this.leadService.updateLead(req.params.id as string, validated, req.userId!);
      res.json({ success: true, data: lead });
    } catch (error) {
      next(error);
    }
  };

  private convert = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lead = await this.leadService.convertToMember(req.params.id as string, req.userId!);
      res.json({ success: true, data: lead, message: 'Lead converted. Create a member record next.' });
    } catch (error) {
      next(error);
    }
  };

  private remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.leadService.deleteLead(req.params.id as string, req.userId!);
      res.json({ success: true, message: 'Lead deleted.' });
    } catch (error) {
      next(error);
    }
  };
}
