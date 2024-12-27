import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { SessionsService } from '../sessions/sessions.service';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';

@Module({
  imports: [JwtModule, PassportModule],
  controllers: [AuthController],
  providers: [
    JwtRefreshStrategy,
    AuthService,
    JwtService,
    UserService,
    SessionsService,
    LocalStrategy,
    JwtStrategy,
  ],
})
export class AuthModule {}
