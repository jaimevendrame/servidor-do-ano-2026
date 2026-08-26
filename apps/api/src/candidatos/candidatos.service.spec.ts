/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { CandidatosService } from './candidatos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CandidatosService', () => {
  let service: CandidatosService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatosService,
        {
          provide: PrismaService,
          useValue: {
            setor: { findFirst: jest.fn() },
            eleitor: { findFirst: jest.fn() },
            candidato: {
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CandidatosService>(CandidatosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('cria candidato quando setor existe na edicao', async () => {
    (prisma.setor.findFirst as jest.Mock).mockResolvedValue({ id: 1, edicaoId: 1 });
    (prisma.candidato.create as jest.Mock).mockResolvedValue({
      id: 1, nome: 'Maria', setorId: 1, edicaoId: 1,
    });

    const resultado = await service.criar({
      edicaoId: 1, setorId: 1, nome: 'Maria',
    });

    expect(resultado.nome).toBe('Maria');
  });

  it('rejeita se setor nao pertence a edicao', async () => {
    (prisma.setor.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.criar({ edicaoId: 1, setorId: 999, nome: 'Test' })
    ).rejects.toThrow('Setor nao encontrado nesta edicao');
  });

  it('valida eleitor pertence ao setor', async () => {
    (prisma.setor.findFirst as jest.Mock).mockResolvedValue({ id: 1, edicaoId: 1 });
    (prisma.eleitor.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.criar({ edicaoId: 1, setorId: 1, eleitorId: 99, nome: 'Test' })
    ).rejects.toThrow('Eleitor nao encontrado ou nao pertence ao setor');
  });

  it('cria candidato vinculado a eleitor valido', async () => {
    (prisma.setor.findFirst as jest.Mock).mockResolvedValue({ id: 1, edicaoId: 1 });
    (prisma.eleitor.findFirst as jest.Mock).mockResolvedValue({ id: 5, setorId: 1 });
    (prisma.candidato.create as jest.Mock).mockResolvedValue({
      id: 2, nome: 'Joao', setorId: 1, eleitorId: 5,
    });

    const resultado = await service.criar({
      edicaoId: 1, setorId: 1, eleitorId: 5, nome: 'Joao',
    });

    expect(resultado.eleitorId).toBe(5);
  });

  it('lista candidatos por setor ordenados por ordemExibicao', async () => {
    (prisma.candidato.findMany as jest.Mock).mockResolvedValue([
      { id: 1, nome: 'A', ordemExibicao: 0 },
      { id: 2, nome: 'B', ordemExibicao: 1 },
    ]);

    const resultado = await service.listarPorSetor(1, 1);
    expect(resultado).toHaveLength(2);
    expect(prisma.candidato.findMany).toHaveBeenCalledWith({
      where: { edicaoId: 1, setorId: 1 },
      orderBy: { ordemExibicao: 'asc' },
    });
  });

  it('atualiza nome e ordem', async () => {
    (prisma.candidato.update as jest.Mock).mockResolvedValue({
      id: 1, nome: 'Novo Nome', ordemExibicao: 3,
    });

    const resultado = await service.atualizar(1, { nome: 'Novo Nome', ordemExibicao: 3 });
    expect(resultado.nome).toBe('Novo Nome');
  });

  it('remove candidato', async () => {
    (prisma.candidato.delete as jest.Mock).mockResolvedValue({ id: 1 });
    await service.remover(1);
    expect(prisma.candidato.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
