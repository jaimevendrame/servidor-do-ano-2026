/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { PainelAdminService } from './painel-admin.service';
import { PainelAdminController } from './painel-admin.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PainelAdminService],
  controllers: [PainelAdminController],
  exports: [PainelAdminService],
})
export class ApuracaoModule {}
