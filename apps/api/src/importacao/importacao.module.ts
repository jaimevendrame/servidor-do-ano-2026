/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ImportacaoController } from './importacao.controller';
import { ImportacaoService } from './importacao.service';
import { GravacaoService } from './gravacao.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ImportacaoController],
  providers: [ImportacaoService, GravacaoService],
  exports: [ImportacaoService, GravacaoService],
})
export class ImportacaoModule {}
