import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT') || 3001;
  const NODE_ENV = configService.get<number>('NODE_ENV') || 'development';

  const config = new DocumentBuilder()
    .setTitle('CRM-API')
    .setDescription('Api doucmentation for CRM')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))

  // app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(PORT, () => {
    console.log(`Running API in MODE:${NODE_ENV} on Port: ${PORT}`);
  });
}
bootstrap();
