import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Missing or malformed Authorization header.',
        });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded = this.authService.verifyToken(token);

      req.userId = decoded.userId;
      next();
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'Authentication failed. Please log in again.',
      });
    }
  };
}
