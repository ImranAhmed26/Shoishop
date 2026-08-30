import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../common/mailer.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async signup(dto: SignupDto): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: dto.role ?? 'BUYER',
      },
    });
  }

  async validateUser(dto: LoginDto): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  sanitizeUser(user: User) {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  issueTokens(user: User): AuthTokens {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET as string,
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as any,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET as string,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
    });

    return { accessToken, refreshToken };
  }

  async refreshFromToken(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.issueTokens(user);
  }

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
  }): Promise<User> {
    const existingByGoogleId = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });
    if (existingByGoogleId) return existingByGoogleId;

    const existingByEmail = await this.prisma.user.findUnique({ where: { email: profile.email } });
    if (existingByEmail) {
      return this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: { googleId: profile.googleId },
      });
    }

    return this.prisma.user.create({
      data: { email: profile.email, name: profile.name, googleId: profile.googleId, role: 'BUYER' },
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always resolve the same way whether or not the email exists, so this
    // endpoint can't be used to enumerate registered accounts.
    if (!user) return;

    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetLink = `${process.env.APP_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;
    await this.mailerService.sendPasswordResetEmail(user.email, resetLink);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }
}
