/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface EdicaoDto {
  id: number;
  ano: number;
  slug: string;
  nomePrefeitura: string;
  cidade: string | null;
  descricao: string | null;
  ativo: boolean;
  criadoEm: Date;
}

export interface EdicaoAtivaDto extends EdicaoDto {
  vigencia: { dataInicio: string; dataFim: string } | null;
  statusVotacao: 'sem_janela' | 'em_breve' | 'aberta' | 'encerrada';
}

export interface CriarEdicaoDto {
  ano: number;
  nomePrefeitura: string;
  cidade?: string;
  descricao?: string;
}

/**
 * Gera slug a partir da prefeitura, cidade e ano.
 * Formato: "servidordoano{ano}{cidadeSlug}"
 * Ex: "Prefeitura de Campo Mourão" + 2027 + "Campo Mourão" → "servidordoano2027campomourao"
 */
export function gerarSlug(ano: number, cidade?: string): string {
  const cidadeSlug = cidade
    ? cidade
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // remove acentos
        .replace(/[^a-z0-9]/g, '') // remove tudo que não é alfanumérico
    : '';
  return `servidordoano${ano}${cidadeSlug}`;
}

function mapEdicao(e: { id: number; ano: number; slug: string; nomePrefeitura: string; cidade: string | null; descricao: string | null; ativo: boolean; criadoEm: Date }): EdicaoDto {
  return {
    id: e.id,
    ano: e.ano,
    slug: e.slug,
    nomePrefeitura: e.nomePrefeitura,
    cidade: e.cidade,
    descricao: e.descricao,
    ativo: e.ativo,
    criadoEm: e.criadoEm,
  };
}

@Injectable()
export class EdicaoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova eleição com slug automático.
   */
  async criar(dto: CriarEdicaoDto): Promise<EdicaoDto> {
    const existe = await this.prisma.edicao.findUnique({ where: { ano: dto.ano } });
    if (existe) {
      throw new Error(`Eleição para o ano ${dto.ano} já existe (id=${existe.id})`);
    }

    let slug = gerarSlug(dto.ano, dto.cidade);

    // Garante unicidade do slug (sufixo numérico se colidir)
    let tentativa = 0;
    while (await this.prisma.edicao.findUnique({ where: { slug } })) {
      tentativa++;
      slug = `${gerarSlug(dto.ano, dto.cidade)}${tentativa}`;
    }

    const edicao = await this.prisma.edicao.create({
      data: {
        ano: dto.ano,
        slug,
        nomePrefeitura: dto.nomePrefeitura,
        cidade: dto.cidade || null,
        descricao: dto.descricao || null,
        ativo: true,
      },
    });

    return mapEdicao(edicao);
  }

  /**
   * Lista todas as eleições (admin).
   */
  async listar(): Promise<EdicaoDto[]> {
    const edicoes = await this.prisma.edicao.findMany({ orderBy: { ano: 'desc' } });
    return edicoes.map(mapEdicao);
  }

  /**
   * Lista eleições ativas com vigência (para home pública).
   */
  async listarAtivas(): Promise<EdicaoAtivaDto[]> {
    const edicoes = await this.prisma.edicao.findMany({
      where: { ativo: true },
      orderBy: { ano: 'desc' },
      include: { janela: true },
    });

    const agora = new Date();

    return edicoes.map(e => {
      let vigencia: EdicaoAtivaDto['vigencia'] = null;
      let statusVotacao: EdicaoAtivaDto['statusVotacao'] = 'sem_janela';

      if (e.janela) {
        vigencia = {
          dataInicio: e.janela.dataInicio.toISOString(),
          dataFim: e.janela.dataFim.toISOString(),
        };

        const dentroJanela = agora >= e.janela.dataInicio && agora <= e.janela.dataFim;
        const aberta = (dentroJanela || e.janela.abertaManual) && !e.janela.fechadaManual;

        if (aberta) {
          statusVotacao = 'aberta';
        } else if (agora < e.janela.dataInicio && !e.janela.fechadaManual) {
          statusVotacao = 'em_breve';
        } else {
          statusVotacao = 'encerrada';
        }
      }

      return {
        ...mapEdicao(e),
        vigencia,
        statusVotacao,
      };
    });
  }

  /**
   * Obtém uma eleição por ID.
   */
  async obter(id: number): Promise<EdicaoDto> {
    const edicao = await this.prisma.edicao.findUnique({ where: { id } });
    if (!edicao) throw new Error(`Eleição com id=${id} não encontrada`);
    return mapEdicao(edicao);
  }

  /**
   * Obtém uma eleição por slug.
   */
  async obterPorSlug(slug: string): Promise<EdicaoDto> {
    const edicao = await this.prisma.edicao.findUnique({ where: { slug } });
    if (!edicao) throw new Error(`Eleição com slug="${slug}" não encontrada`);
    return mapEdicao(edicao);
  }

  async ativar(id: number): Promise<EdicaoDto> {
    const edicao = await this.prisma.edicao.update({ where: { id }, data: { ativo: true } });
    return mapEdicao(edicao);
  }

  async desativar(id: number): Promise<EdicaoDto> {
    const edicao = await this.prisma.edicao.update({ where: { id }, data: { ativo: false } });
    return mapEdicao(edicao);
  }
}
