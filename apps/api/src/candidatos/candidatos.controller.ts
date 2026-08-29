/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { CandidatosService } from './candidatos.service';
import { CriarCandidatoDto, AtualizarCandidatoDto } from './dto/candidato.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('candidatos')
export class CandidatosController {
  constructor(private readonly candidatosService: CandidatosService) {}

  @Post()
  @UseGuards(AdminAuthGuard)
  async criar(@Body() dto: CriarCandidatoDto) {
    try {
      return await this.candidatosService.criar(dto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao criar candidato'
      );
    }
  }

  @Get()
  async listar(@Query('edicaoId') edicaoId: string, @Query('setorId') setorId?: string) {
    const eid = parseInt(edicaoId);
    if (isNaN(eid)) throw new BadRequestException('edicaoId obrigatorio');

    if (setorId) {
      return this.candidatosService.listarPorSetor(eid, parseInt(setorId));
    }
    return this.candidatosService.listarPorEdicao(eid);
  }

  @Put(':id')
  @UseGuards(AdminAuthGuard)
  async atualizar(@Param('id') id: string, @Body() dto: AtualizarCandidatoDto) {
    try {
      return await this.candidatosService.atualizar(parseInt(id), dto);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro ao atualizar');
    }
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  async remover(@Param('id') id: string) {
    try {
      return await this.candidatosService.remover(parseInt(id));
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Erro ao remover');
    }
  }
}
