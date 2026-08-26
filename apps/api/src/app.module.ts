/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ImportacaoModule } from './importacao/importacao.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CandidatosModule } from './candidatos/candidatos.module';
import { VotacaoModule } from './votacao/votacao.module';
import { ApuracaoModule } from './apuracao/apuracao.module';

@Module({
  imports: [PrismaModule, ImportacaoModule, AuthModule, CandidatosModule, VotacaoModule, ApuracaoModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
