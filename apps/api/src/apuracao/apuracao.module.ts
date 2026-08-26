/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PainelAdminService } from './painel-admin.service';
import { PainelAdminController } from './painel-admin.controller';
import { ApuracaoService } from './apuracao.service';
import { ApuracaoController } from './apuracao.controller';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaController } from './auditoria.controller';
import { RetencaoService } from './retencao.service';
import { RetencaoController } from './retencao.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PainelAdminService, ApuracaoService, AuditoriaService, RetencaoService],
  controllers: [PainelAdminController, ApuracaoController, AuditoriaController, RetencaoController],
  exports: [PainelAdminService, ApuracaoService, AuditoriaService, RetencaoService],
})
export class ApuracaoModule {}
