import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { loginSchema, registerSchema } from '../utils/validation';

export class AuthController {
  public router: Router;

  constructor(
    private authService: AuthService,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/login', this.login);
    this.router.post('/register', this.authMiddleware.authenticate, this.register);
    this.router.get('/me', this.authMiddleware.authenticate, this.getMe);
  }

  private login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await this.authService.login(validated);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  private register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await this.authService.register(validated);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  private getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.getUserById(req.userId!);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };
}
