/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PainelAdminService } from './painel-admin.service';
import { PainelAdminController } from './painel-admin.controller';
import { ApuracaoService } from './apuracao.service';
import { ApuracaoController } from './apuracao.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PainelAdminService, ApuracaoService],
  controllers: [PainelAdminController, ApuracaoController],
  exports: [PainelAdminService, ApuracaoService],
})
export class ApuracaoModule {}
