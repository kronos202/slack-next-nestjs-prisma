import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app/app.config';
import authConfig from './config/auth/auth.config';
import { SendGridModule } from '@libs/integration/sendgrid';
import { AuthModule } from './domain/auth/auth.module';
import templateConfig from './config/template/template.config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, templateConfig],
      envFilePath:
        process.env.NODE_ENV === 'development'
          ? '.env.development'
          : '.env.production',
    }),
    SendGridModule.forRoot({
      apiKey: process.env.SENDGRID_API_KEY,
      defaultSender: process.env.SENDGRID_FROM_EMAIL,
    }),
    DatabaseModule,
    AuthModule,
    UploadModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    Logger,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
