/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { EleitorService } from './eleitores.service';
import { EleitorController } from './eleitores.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ApuracaoModule } from '../apuracao/apuracao.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, ApuracaoModule, AuthModule],
  providers: [EleitorService],
  controllers: [EleitorController],
  exports: [EleitorService],
})
export class EleitoresModule {}
