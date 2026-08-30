import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MailerService } from '../common/mailer.service';

// GoogleStrategy's constructor calls super() with clientID/clientSecret — passport-oauth2
// throws at construction time if those are missing, so it's only registered when the env
// vars are actually configured. Without them, /auth/google 404s instead of crashing on boot.
const googleProviders = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? [GoogleStrategy]
  : [];

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, MailerService, ...googleProviders],
  exports: [AuthService],
})
export class AuthModule {}
