import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';

@Injectable()
export class PublicOnlyGuard extends JwtAuthGuard {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Throw an exception if user is logged in
    if (err || user) {
      throw err || new UnauthorizedException();
    }
    return null;
  }
}
