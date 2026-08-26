/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { CedulaService } from './cedula.service';
import { CedulaController } from './cedula.controller';
import { VotoService } from './voto.service';
import { VotoController } from './voto.controller';
import { ComprovanteService } from './comprovante.service';
import { ComprovanteController } from './comprovante.controller';
import { ReentradaService } from './reentrada.service';
import { ReentradaController } from './reentrada.controller';
import { JanelaService } from './janela.service';
import { JanelaController } from './janela.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CedulaService, VotoService, ComprovanteService, ReentradaService, JanelaService],
  controllers: [CedulaController, VotoController, ComprovanteController, ReentradaController, JanelaController],
  exports: [CedulaService, VotoService, ComprovanteService, ReentradaService, JanelaService],
})
export class VotacaoModule {}