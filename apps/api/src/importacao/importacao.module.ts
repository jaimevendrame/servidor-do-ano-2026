/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ImportacaoController } from './importacao.controller';
import { ImportacaoService } from './importacao.service';
import { GravacaoService } from './gravacao.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImportacaoController],
  providers: [ImportacaoService, GravacaoService],
  exports: [ImportacaoService, GravacaoService],
})
export class ImportacaoModule {}
