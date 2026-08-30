import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Validates the JWT if present, but never throws — used for routes like
 * guest checkout where both logged-in buyers and anonymous guests are allowed.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(_err: any, user: any) {
    return user ?? null;
  }
}
