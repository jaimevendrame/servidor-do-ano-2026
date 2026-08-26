/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { CedulaService } from './cedula.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CedulaService', () => {
  let service: CedulaService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CedulaService,
        {
          provide: PrismaService,
          useValue: {
            eleitor: { findUnique: jest.fn() },
            candidato: {
              count: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CedulaService>(CedulaService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('retorna cedula votavel com candidatos do setor do eleitor', async () => {
    (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({
      id: 1, edicaoId: 1, setorId: 5,
    });
    (prisma.candidato.count as jest.Mock).mockResolvedValue(3);
    (prisma.candidato.findMany as jest.Mock).mockResolvedValue([
      { id: 10, nome: 'Maria', cargo: 'Analista', ordemExibicao: 0 },
      { id: 11, nome: 'Joao', cargo: 'Tecnico', ordemExibicao: 1 },
      { id: 12, nome: 'Ana', cargo: 'Diretora', ordemExibicao: 2 },
    ]);

    const resultado = await service.obter(1);

    expect(resultado.votavel).toBe(true);
    expect(resultado.candidatos).toHaveLength(3);
    expect(prisma.candidato.findMany).toHaveBeenCalledWith({
      where: { edicaoId: 1, setorId: 5 },
      orderBy: { ordemExibicao: 'asc' },
      select: { id: true, nome: true, cargo: true, ordemExibicao: true },
    });
  });

  it('retorna setor sem candidatos', async () => {
    (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({
      id: 1, edicaoId: 1, setorId: 5,
    });
    (prisma.candidato.count as jest.Mock).mockResolvedValue(0);

    const resultado = await service.obter(1);

    expect(resultado.votavel).toBe(false);
    expect(resultado.motivo).toBe('SETOR_SEM_CANDIDATOS');
    expect(resultado.candidatos).toHaveLength(0);
  });

  it('retorna setor com um unico candidato', async () => {
    (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({
      id: 1, edicaoId: 1, setorId: 5,
    });
    (prisma.candidato.count as jest.Mock).mockResolvedValue(1);

    const resultado = await service.obter(1);

    expect(resultado.votavel).toBe(false);
    expect(resultado.motivo).toBe('SETOR_COM_UM_CANDIDATO');
  });

  it('escopo por setor: consulta candidatos so do setor do eleitor', async () => {
    (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({
      id: 1, edicaoId: 1, setorId: 7,
    });
    (prisma.candidato.count as jest.Mock).mockResolvedValue(2);
    (prisma.candidato.findMany as jest.Mock).mockResolvedValue([]);

    await service.obter(1);

    expect(prisma.candidato.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { edicaoId: 1, setorId: 7 } })
    );
  });

  it('falha se eleitor nao existe', async () => {
    (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.obter(999)).rejects.toThrow('Eleitor nao encontrado');
  });
});