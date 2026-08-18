import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Joi from 'joi';
import { AttachmentsModule } from './attachments/attachments.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BoardsModule } from './boards/boards.module';
import { ColumnsModule } from './columns/columns.module';
import { JwtAuthGuard } from './common/auth';
import { SystemRolesGuard } from './common/system-roles';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { RequestLoggingInterceptor } from './common/request-logging.interceptor';
import { AppConfigModule } from './config/config.module';
import { ENTITIES } from './database/entities';
import { HealthModule } from './health/health.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['packages/kanban-api/.env'], validationSchema: Joi.object({
      NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'), PORT: Joi.number().default(3001), CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
      DATABASE_URL: Joi.string().required(), JWT_SECRET: Joi.string().min(32).required(), JWT_EXPIRES_IN: Joi.string().default('15m'), REFRESH_TOKEN_TTL_SECONDS: Joi.number().integer().min(60).default(2592000), REDIS_URL: Joi.string().required(), CACHE_TTL_SECONDS: Joi.number().default(60),
      AUTH_RATE_LIMIT: Joi.number().default(10), AUTH_RATE_WINDOW_SECONDS: Joi.number().default(60), MINIO_ENDPOINT: Joi.string().required(), MINIO_ACCESS_KEY: Joi.string().required(), MINIO_SECRET_KEY: Joi.string().required(), MINIO_BUCKET: Joi.string().default('kanban-attachments'), UPLOAD_MAX_BYTES: Joi.number().default(10485760),
    }) }),
    TypeOrmModule.forRootAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ type: 'postgres', url: config.getOrThrow('DATABASE_URL'), entities: ENTITIES, synchronize: false }) }),
    AppConfigModule, InfrastructureModule, AuthModule, UsersModule, AdminModule, BoardsModule, ColumnsModule, TasksModule, AttachmentsModule, HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: SystemRolesGuard },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
  ],
})
export class AppModule implements NestModule { configure(consumer: MiddlewareConsumer) { consumer.apply(RequestContextMiddleware).forRoutes({ path: '{*path}', method: RequestMethod.ALL }); } }
