import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import ms from 'ms';

import { UserService } from '../user/user.service';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { JwtService } from '@nestjs/jwt';
import dayjs from 'dayjs';
import { getAuthConfig, getTemplateConfig } from 'src/utils/helpers/getConfig';
import { ConfigService } from '@nestjs/config';
import { AuthConfig } from 'src/config/auth/auth-config.types';
import { Session, User } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { SendgridService } from '@libs/integration/sendgrid';
import { TemplateConfig } from 'src/config/template/template.type';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { EncryptHelper } from 'src/utils/helpers/encrypt.helper';
import { SessionsService } from '../sessions/sessions.service';
import { JwtRefreshPayloadType } from './strategy/types/jwt-refresh-payload.type';
import { JwtPayloadType } from './strategy/types/jwt-payload.type';
import { mapUserToDto } from '../user/mapper/userToDto.mapper';
import { RoleEnum } from 'src/common/enums/role.enum';

@Injectable()
export class AuthService {
  private readonly templateConfig = getTemplateConfig(
    this.templateConfigService,
  );
  private readonly authConfig = getAuthConfig(this.authConfigService);

  constructor(
    private readonly userService: UserService,
    protected databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionsService,
    private readonly authConfigService: ConfigService<AuthConfig>,
    private readonly templateConfigService: ConfigService<TemplateConfig>,
    private readonly sendgridService: SendgridService,
  ) {}

  async register(dto: AuthRegisterLoginDto) {
    const { email, password, confirmPassword, username, firstName, lastName } =
      dto;

    if (confirmPassword != password) {
      throw new BadRequestException('Email or username already in use');
    }
    const hashedPassword = EncryptHelper.hash(password);

    const user = await this.databaseService.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        firstName,
        lastName,
      },
    });

    const hash = await this.jwtService.signAsync(
      {
        confirmEmailUserId: user.id,
      },
      {
        secret: this.authConfig.auth.confirm_email_secret,
        expiresIn: this.authConfig.auth.confirm_email_expires,
      },
    );

    await this.sendgridService.sendDynamicEmail(
      user.email,
      this.templateConfig.template.activation_email_template_id,
      {
        username: user.username,
        verification_link: hash,
      },
    );
  }

  async confirmEmail(hash: string, sessionId?: Session['id']): Promise<void> {
    let userId: User['id'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: User['id'];
      }>(hash, {
        secret: this.authConfig.auth.confirm_email_secret,
      });

      userId = jwtData.confirmEmailUserId;
    } catch {
      throw new UnprocessableEntityException({ message: 'invalid hash' });
    }

    const user = await this.userService.findOneOrFail(userId);

    if (!user || user?.active !== false) {
      throw new NotFoundException('User not found');
    }

    user.active = true;

    await this.userService.updateUser(user.id, user, sessionId);
  }

  async login(authEmailLoginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    const user = await this.userService.findOneOrFailByEmailWithRoles(
      authEmailLoginDto.email,
    );

    const isValidPassword = EncryptHelper.compare(
      authEmailLoginDto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnprocessableEntityException(
        'Có lỗi xảy ra khi đăng nhập. Hãy kiểm tra lại tài khoản hoặc mật khẩu.',
      );
    }

    const hash = EncryptHelper.genSha256();

    const session = await this.sessionService.create({
      userId: user.id,
      hash,
    });

    const role = user.role;

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      role,
      sessionId: session.id,
      hash,
    });
    return {
      refreshToken,
      token,
      tokenExpires,

      user: mapUserToDto(user),
    };
  }

  private async getTokensData(data: {
    id: User['id'];
    role: string;
    sessionId: Session['id'];
    hash: Session['hash'];
  }) {
    const tokenExpiresIn = this.authConfig.auth.access_expires_time;
    const refreshExpiresIn = this.authConfig.auth.refresh_expires_time;

    const tokenExpires = Date.now() + ms(tokenExpiresIn);
    const refreshTokenExpires = Date.now() + ms(refreshExpiresIn);

    const [token, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          roles: data.role,
          sessionId: data.sessionId,
        },
        {
          secret: this.authConfig.auth.access_secret_key,
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
          roles: data.role,
        },
        {
          secret: this.authConfig.auth.refresh_secret_key,
          expiresIn: refreshTokenExpires,
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userService.findOneOrFailByEmail(email);

    const isMatch = EncryptHelper.compare(password, user.password);

    if (!isMatch) {
      throw new UnprocessableEntityException(
        'Có lỗi xảy ra khi đăng nhập. Hãy kiểm tra lại tài khoản hoặc mật khẩu',
      );
    }
    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userService.findOneOrFailByEmail(email);

    if (!user) {
      throw new UnprocessableEntityException('emailNotExists');
    }

    const tokenExpiresIn = this.authConfig.auth.forgot_password_expires;

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const hash = await this.jwtService.signAsync(
      {
        forgotUserId: user.id,
      },
      {
        secret: this.authConfig.auth.forgot_password_secret,
        expiresIn: tokenExpiresIn,
      },
    );

    await this.sendgridService.sendDynamicEmail(
      user.email,
      this.templateConfig.template.reset_password_template_id,
      {
        user_name: user.username,
        forgot_link: hash,
        expires_in: dayjs(tokenExpires).format('HH:mm DD/MM/YYYY'),
      },
    );
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    let userId: User['id'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        forgotUserId: User['id'];
      }>(hash, {
        secret: this.authConfig.auth.forgot_password_secret,
      });

      userId = jwtData.forgotUserId;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const user = await this.userService.findById({ id: userId });

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `notFound`,
        },
      });
    }

    user.password = password;

    await this.sessionService.deleteAllSessionsByUserId(user.id);

    await this.userService.updateUser(user.id, user);
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId' | 'hash'>,
    role: RoleEnum,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    const session = await this.sessionService.findSessionById(data.sessionId);

    if (!session) {
      throw new UnauthorizedException('session not found');
    }

    if (session.hash !== data.hash) {
      throw new UnauthorizedException('invalid data hash');
    }

    const hash = EncryptHelper.genSha256();

    if (!role) {
      throw new UnauthorizedException('invalid data roles');
    }

    await this.sessionService.updateSession(session.id, {
      hash,
    });

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: session.userId,
      role,
      sessionId: session.id,
      hash,
    });

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  async me(userJwtPayload: JwtPayloadType) {
    const user = await this.databaseService.user.findFirst({
      where: {
        id: userJwtPayload.id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return mapUserToDto(user);
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
    return this.sessionService.deleteById(data.sessionId);
  }
}
