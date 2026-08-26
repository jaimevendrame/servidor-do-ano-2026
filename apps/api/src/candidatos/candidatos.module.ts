/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { CandidatosService } from './candidatos.service';
import { CandidatosController } from './candidatos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CandidatosService],
  controllers: [CandidatosController],
  exports: [CandidatosService],
})
export class CandidatosModule {}
