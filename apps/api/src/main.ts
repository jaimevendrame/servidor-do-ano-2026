import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Permite payloads de JSON maiores para importação de planilhas com milhares de linhas
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));

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
