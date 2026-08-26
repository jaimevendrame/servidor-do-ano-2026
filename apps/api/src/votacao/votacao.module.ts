/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { CedulaService } from './cedula.service';
import { CedulaController } from './cedula.controller';
import { VotoService } from './voto.service';
import { VotoController } from './voto.controller';
import { ComprovanteService } from './comprovante.service';
import { ComprovanteController } from './comprovante.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CedulaService, VotoService, ComprovanteService],
  controllers: [CedulaController, VotoController, ComprovanteController],
  exports: [CedulaService, VotoService, ComprovanteService],
})
export class VotacaoModule {}