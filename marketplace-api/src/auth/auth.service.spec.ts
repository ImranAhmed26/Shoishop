import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../common/mailer.service';

describe('AuthService password reset', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    passwordResetToken: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };
  let mailer: { sendPasswordResetEmail: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      passwordResetToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    mailer = { sendPasswordResetEmail: jest.fn() };
    service = new AuthService(
      prisma as unknown as PrismaService,
      {} as JwtService,
      mailer as unknown as MailerService,
    );
  });

  it('does not reveal whether an email is registered', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await service.requestPasswordReset('nobody@example.com');

    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('creates a hashed, time-boxed token and emails a link for a real user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });

    await service.requestPasswordReset('user@example.com');

    expect(prisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
    const { data } = prisma.passwordResetToken.create.mock.calls[0][0];
    expect(data.userId).toBe('user-1');
    expect(data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(mailer.sendPasswordResetEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.stringContaining('/reset-password?token='),
    );
  });

  it('rejects an expired reset token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.resetPassword('some-token', 'newpassword123')).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a reset token that was already used', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000),
    });

    await expect(service.resetPassword('some-token', 'newpassword123')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('resets the password and marks a valid token used', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 1000),
    });

    await service.resetPassword('some-token', 'newpassword123');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
