/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ImportacaoModule } from './importacao/importacao.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CandidatosModule } from './candidatos/candidatos.module';
import { VotacaoModule } from './votacao/votacao.module';
import { ApuracaoModule } from './apuracao/apuracao.module';
import { HealthModule } from './health/health.module';
import { EdicaoModule } from './edicao/edicao.module';
import { EleitoresModule } from './eleitores/eleitores.module';

@Module({
  imports: [PrismaModule, ImportacaoModule, AuthModule, CandidatosModule, VotacaoModule, ApuracaoModule, HealthModule, EdicaoModule, EleitoresModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
