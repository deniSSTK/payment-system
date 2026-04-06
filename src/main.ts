import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_COOKIE_AUTH,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_AUTH,
} from './common/constants/auth.constants';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const dataSource = app.get(DataSource);
  const port = Number(configService.get('PORT', 3000));
  const autoRunMigrations = configService.get<string>('AUTO_RUN_MIGRATIONS', 'true') === 'true';
  const corsOrigin = (configService.get<string>('APP_CORS_ORIGIN', 'http://localhost:3000') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: corsOrigin.length > 0 ? corsOrigin : true,
    credentials: true,
  });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Authentication and Billing API')
      .setDescription('Secure user authentication and billing system built with NestJS.')
      .setVersion('1.0.0')
      .addCookieAuth(
        ACCESS_TOKEN_COOKIE,
        { type: 'apiKey', in: 'cookie' },
        ACCESS_TOKEN_COOKIE_AUTH,
      )
      .addCookieAuth(
        REFRESH_TOKEN_COOKIE,
        { type: 'apiKey', in: 'cookie' },
        REFRESH_TOKEN_COOKIE_AUTH,
      )
      .build(),
  );

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  if (autoRunMigrations) {
    await dataSource.runMigrations();
  }

  await app.listen(port);
}

void bootstrap();
