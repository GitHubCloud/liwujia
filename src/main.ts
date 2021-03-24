import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { RESTfulResponseInterceptor } from './restful-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // swagger generate
  const swaggerConfig = new DocumentBuilder()
    .setTitle('理物+ API')
    .setDescription('理物+ API Swagger 文档')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/', app, document);

  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  // format RESTful response
  app.useGlobalInterceptors(new RESTfulResponseInterceptor());

  app.enableCors();
  await app.listen(3000);
}
bootstrap();
