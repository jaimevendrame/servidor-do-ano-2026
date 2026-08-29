/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { EdicaoService } from './edicao.service';
import { EdicaoController } from './edicao.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EdicaoService],
  controllers: [EdicaoController],
  exports: [EdicaoService],
})
export class EdicaoModule {}
