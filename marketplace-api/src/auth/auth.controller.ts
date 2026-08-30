import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { AuthService, AuthTokens } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';

function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: maxAgeMs,
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(res: Response, tokens: AuthTokens) {
    res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOptions(15 * 60 * 1000));
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
  }

  @Public()
  @Post('signup')
  async signup(@Body() dto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.signup(dto);
    const tokens = this.authService.issueTokens(user);
    this.setAuthCookies(res, tokens);
    return this.authService.sanitizeUser(user);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    const tokens = this.authService.issueTokens(user);
    this.setAuthCookies(res, tokens);
    return this.authService.sanitizeUser(user);
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const tokens = await this.authService.refreshFromToken(refreshToken);
    this.setAuthCookies(res, tokens);
    return { success: true };
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_COOKIE);
    return { success: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
