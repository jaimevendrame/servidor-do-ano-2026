/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { EdicaoService } from './edicao.service';
import { EdicaoController } from './edicao.controller';
import { EnsaioService } from './ensaio.service';
import { EnsaioController } from './ensaio.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [EdicaoService, EnsaioService],
  controllers: [EdicaoController, EnsaioController],
  exports: [EdicaoService, EnsaioService],
})
export class EdicaoModule {}
