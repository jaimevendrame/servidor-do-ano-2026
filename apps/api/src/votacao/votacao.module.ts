/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { CedulaService } from './cedula.service';
import { CedulaController } from './cedula.controller';
import { VotoService } from './voto.service';
import { VotoController } from './voto.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CedulaService, VotoService],
  controllers: [CedulaController, VotoController],
  exports: [CedulaService, VotoService],
})
export class VotacaoModule {}