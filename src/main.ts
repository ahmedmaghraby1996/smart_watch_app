import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import SwaggerSetup from './core/setups/swagger.setup';
import * as compression from 'compression';
import helmet from 'helmet';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.enableCors();
 // helmet
  app.use(compression());
  app.setGlobalPrefix('v1', {
    exclude: [{ path: 'swagger', method: RequestMethod.GET }],
  });

  const config = app.get<ConfigService>(ConfigService);
  const app_env = config.get('APP_ENV');

  if (app_env !== 'production') {
    Logger.log(`App running on ${app_env} environment`);
    SwaggerSetup(app, config);
  }
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts if needed
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
          imgSrc: ["'self'", "data:"], // Allow self-hosted and data URIs
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https:"], // Allow fonts from self and secure sources
        },
      },
      crossOriginResourcePolicy: { policy: "same-origin" }, // Allow resources from the same server
    }),
  );
  // app.use(helmet()); 
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
      forbidUnknownValues: false,
      errorHttpStatusCode: 422,
    }),
  );

  await app.listen(config.get('APP_PORT'));
}
bootstrap();
