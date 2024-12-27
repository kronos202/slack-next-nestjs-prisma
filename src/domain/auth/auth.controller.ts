import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { AuthConfirmEmailDto } from './dto/auth-confirm-email.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { LocalAuthGuard } from 'src/common/guards/local.guard';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { SerializeInterceptor } from 'src/common/interceptors/serialize.interceptor';
import { NullableType } from 'src/utils/types/nullable';
import { User } from '@prisma/client';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { UserService } from '../user/user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiOperationDecorator,
  ApiResponseType,
} from 'src/common/decorators/api-operation.decorator';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { RefreshJwtAuthGuard } from 'src/common/guards/refresh-jwt-auth.guard';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { IS_SKIP_GLOBAL_JWT_GUARD } from 'src/common/decorators/ignore-global-jwt.decorator';

@Controller('auth')
@ApiTags('auth')
@UseInterceptors(SerializeInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('refresh')
  @IS_SKIP_GLOBAL_JWT_GUARD()
  @UseGuards(RefreshJwtAuthGuard)
  public refresh(@Request() request): Promise<RefreshResponseDto> {
    return this.authService.refreshToken(
      { sessionId: request.user.sessionId, hash: request.user.hash },
      request.user.role,
    );
  }

  @Post('email/login')
  @ApiOperationDecorator({
    type: LoginResponseDto,
    summary: 'User Login ',
    description: 'User Login',
    path: '/api/auth/email/login',
  })
  @Public()
  @UseGuards(LocalAuthGuard)
  async login(
    @Body() authEmailLoginDto: AuthEmailLoginDto,
  ): Promise<LoginResponseDto> {
    return await this.authService.login(authEmailLoginDto);
  }

  @Post('email/register')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Public()
  async register(
    @Body() authRegisterLoginDto: AuthRegisterLoginDto,
  ): Promise<void> {
    return await this.authService.register(authRegisterLoginDto);
  }

  @Post('email/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Public()
  async confirmEmail(
    @Body() authConfirmEmailDto: AuthConfirmEmailDto,
  ): Promise<void> {
    return await this.authService.confirmEmail(authConfirmEmailDto.hash);
  }

  @ApiOperationDecorator({
    type: UserResponseDto,
    summary: 'get me',
    description: 'get me',
    path: '/api/auth/me',
    exclude: [ApiResponseType.Forbidden],
  })
  @ApiBearerAuth()
  @Get('me')
  public me(@Request() request): Promise<NullableType<UserResponseDto>> {
    return this.authService.me(request.user);
  }

  @Post('forgot/password')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(
    @Body() forgotPasswordDto: AuthForgotPasswordDto,
  ): Promise<void> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset/password')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() resetPasswordDto: AuthResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(
      resetPasswordDto.hash,
      resetPasswordDto.password,
    );
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  public async logout(@Request() request): Promise<void> {
    await this.authService.logout({
      sessionId: request.user.sessionId,
    });
  }

  @ApiOperationDecorator({
    type: UserResponseDto,
    summary: 'update me',
    description: 'update me',
    path: '/api/auth/me',
  })
  @Patch('me')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  public update(
    @Request() request,
    @Body() userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    return this.userService.updateUser(request.user.id, userDto);
  }

  @Delete('me')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(@Request() request): Promise<void> {
    return this.userService.softDeleteUser(request.user);
  }
}
