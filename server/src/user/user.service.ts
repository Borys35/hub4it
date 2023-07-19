import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  async getMe(user: User) {
    return user;
  }
}
