import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    const origins = corsOrigin.split(',').map(o => o.trim());
    app.enableCors({
      origin: origins,
      credentials: true,
    });
  } else {
    // Em desenvolvimento, permite origens locais
    app.enableCors();
  }

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API rodando na porta ${port}`);
}

bootstrap();
