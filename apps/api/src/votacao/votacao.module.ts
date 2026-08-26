/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { CedulaService } from './cedula.service';
import { CedulaController } from './cedula.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CedulaService],
  controllers: [CedulaController],
  exports: [CedulaService],
})
export class VotacaoModule {}