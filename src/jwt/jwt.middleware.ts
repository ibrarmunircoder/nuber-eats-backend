import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from './jwt.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    if ('x-jwt' in req.headers) {
      const token = req.headers['x-jwt'];
      try {
        const decorded = this.jwtService.verify(token.toString());
        if (typeof decorded === 'object' && decorded.hasOwnProperty('id')) {
          const user = await this.userService.findById(decorded.id);
          req['user'] = user;
        }
      } catch (error) {}
    }
    next();
  }
}
