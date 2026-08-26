import { Module } from '@nestjs/common';
import { ImportacaoModule } from './importacao/importacao.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CandidatosModule } from './candidatos/candidatos.module';

@Module({
  imports: [PrismaModule, ImportacaoModule, AuthModule, CandidatosModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
