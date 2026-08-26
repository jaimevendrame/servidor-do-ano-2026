/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { CandidatosService } from './candidatos.service';
import { CandidatosController } from './candidatos.controller';
import { VotacaoStatusService } from './votacao-status.service';
import { VotacaoStatusController } from './votacao-status.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CandidatosService, VotacaoStatusService],
  controllers: [CandidatosController, VotacaoStatusController],
  exports: [CandidatosService, VotacaoStatusService],
})
export class CandidatosModule {}
