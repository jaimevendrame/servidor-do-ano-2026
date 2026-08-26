/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { PainelAdminService } from './painel-admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PainelAdminService', () => {
  let service: PainelAdminService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PainelAdminService,
        {
          provide: PrismaService,
          useValue: {
            janelaVotacao: { findUnique: jest.fn() },
            eleitor: { count: jest.fn() },
            participacao: { count: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<PainelAdminService>(PainelAdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('retorna total participacao e percentual', async () => {
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date('2020-01-01'), dataFim: new Date('2020-01-02'),
      abertaManual: false, fechadaManual: false,
    });
    (prisma.eleitor.count as jest.Mock).mockResolvedValue(100);
    (prisma.participacao.count as jest.Mock).mockResolvedValue(45);

    const resultado = await service.obter(1);

    expect(resultado.totalEleitores).toBe(100);
    expect(resultado.totalParticiparam).toBe(45);
    expect(resultado.percentual).toBe(45);
  });

  it('NUNCA retorna votos, candidatos ou ranking', async () => {
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.eleitor.count as jest.Mock).mockResolvedValue(50);
    (prisma.participacao.count as jest.Mock).mockResolvedValue(10);

    const resultado = await service.obter(1);
    const keys = Object.keys(resultado);

    expect(keys).not.toContain('votos');
    expect(keys).not.toContain('candidatos');
    expect(keys).not.toContain('ranking');
    expect(keys).not.toContain('parcial');
    expect(keys).toEqual(['edicaoId', 'totalEleitores', 'totalParticiparam', 'percentual', 'votacaoAberta']);
  });

  it('detecta votacao aberta quando dentro da janela', async () => {
    const agora = new Date();
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date(agora.getTime() - 60000),
      dataFim: new Date(agora.getTime() + 60000),
      abertaManual: false, fechadaManual: false,
    });
    (prisma.eleitor.count as jest.Mock).mockResolvedValue(10);
    (prisma.participacao.count as jest.Mock).mockResolvedValue(3);

    const resultado = await service.obter(1);
    expect(resultado.votacaoAberta).toBe(true);
  });

  it('votacao fechada quando fechadaManual=true', async () => {
    const agora = new Date();
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date(agora.getTime() - 60000),
      dataFim: new Date(agora.getTime() + 60000),
      abertaManual: false, fechadaManual: true,
    });
    (prisma.eleitor.count as jest.Mock).mockResolvedValue(10);
    (prisma.participacao.count as jest.Mock).mockResolvedValue(3);

    const resultado = await service.obter(1);
    expect(resultado.votacaoAberta).toBe(false);
  });

  it('percentual 0 quando nenhum eleitor', async () => {
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.eleitor.count as jest.Mock).mockResolvedValue(0);
    (prisma.participacao.count as jest.Mock).mockResolvedValue(0);

    const resultado = await service.obter(1);
    expect(resultado.percentual).toBe(0);
  });
});
