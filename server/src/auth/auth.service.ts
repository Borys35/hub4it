import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon from 'argon2';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signUp(dto: AuthDto) {
    const { email, password } = dto;

    try {
      // Generate password hash
      const hash = await argon.hash(password);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          hash,
          username: 'john-doe',
          firstName: 'John',
          lastName: 'Doe',
        },
      });

      // Return JWT
      return this.signToken(user.id, user.username, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new HttpException(
            {
              error: 'Credentials taken',
            },
            HttpStatus.FORBIDDEN,
            { cause: error },
          );
        }
      }
    }
  }

  async signIn(dto: AuthDto) {
    const { email, password } = dto;

    // Find user with given e-mail
    const foundUser = await this.prisma.user.findUnique({
      where: { email },
    });

    // Throw error if user doesn't exist
    if (!foundUser)
      throw new HttpException(
        {
          error: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );

    // Parse hash with given password
    const valid = await argon.verify(foundUser.hash, password);

    // Throw error if password's invalid
    if (!valid)
      throw new HttpException(
        {
          error: 'Wrong credentials',
        },
        HttpStatus.FORBIDDEN,
      );

    // Return JWT
    return this.signToken(foundUser.id, foundUser.username, foundUser.email);
  }

  async signToken(userId: number, username: string, email: string) {
    const payload = { sub: userId, username, email };

    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: '2h',
      secret: this.config.get('JWT_SECRET'),
    });

    return { access_token };
  }
}
