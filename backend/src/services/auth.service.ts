import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { IUser, IUserWithToken } from '../types/interfaces';
import { RegisterUserDTO, LoginDTO } from '../types/dto';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(dto: RegisterUserDTO): Promise<IUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new Error('This email is already registered.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        username: dto.username,
        role: 'OWNER',
      },
    });

    return this.sanitizeUser(user);
  }

  async login(dto: LoginDTO): Promise<IUserWithToken> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated.');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    const token = this.generateToken(user.id);

    return {
      ...this.sanitizeUser(user),
      token,
    };
  }

  verifyToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      return decoded;
    } catch {
      throw new Error('Token is invalid or expired. Please log in again.');
    }
  }

  async getUserById(id: string): Promise<IUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.sanitizeUser(user) : null;
  }

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );
  }

  private sanitizeUser(user: any): IUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}
