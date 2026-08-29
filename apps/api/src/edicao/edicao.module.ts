/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { EdicaoService } from './edicao.service';
import { EdicaoController } from './edicao.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [EdicaoService],
  controllers: [EdicaoController],
  exports: [EdicaoService],
})
export class EdicaoModule {}
