import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import expressBasicAuth from 'express-basic-auth';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors';
import { HttpExceptionFilter } from './common/filters';

const { NODE_ENV, AWS_CLOUDFRONT_DOMAIN, PORT, GUEST_NAME, GUEST_PASSWORD } = process.env;

const isProduction = NODE_ENV === 'production';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: isProduction,
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  if (isProduction) {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: { defaultSrc: ["'self'"], imgSrc: ["'self'", 'data:', `${AWS_CLOUDFRONT_DOMAIN}`] },
        },
      }),
    );
  }

  app.use(['/', '/-json'], expressBasicAuth({ challenge: true, users: { [GUEST_NAME]: GUEST_PASSWORD } }));

  const config = new DocumentBuilder()
    .setTitle('stepmerrily API Docs')
    .setDescription('⚠️: ADMIN 계정으로 로그인해주세요.')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'accessToken')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'refreshToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('/', app, document, { swaggerOptions: { defaultModelsExpandDepth: 0 } });

  await app.listen(PORT);
}

bootstrap();
