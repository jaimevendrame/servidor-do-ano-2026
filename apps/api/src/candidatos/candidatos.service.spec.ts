/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import * as ExcelJS from 'exceljs';
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
            setor: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            eleitor: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
            },
            candidato: {
              create: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
            },
            voto: {
              count: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
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
      id: 1,
      nome: 'Maria',
      setorId: 1,
      edicaoId: 1,
    });

    const resultado = await service.criar({
      edicaoId: 1,
      setorId: 1,
      nome: 'Maria',
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
      id: 2,
      nome: 'Joao',
      setorId: 1,
      eleitorId: 5,
    });

    const resultado = await service.criar({
      edicaoId: 1,
      setorId: 1,
      eleitorId: 5,
      nome: 'Joao',
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
      id: 1,
      nome: 'Novo Nome',
      ordemExibicao: 3,
    });

    const resultado = await service.atualizar(1, { nome: 'Novo Nome', ordemExibicao: 3 });
    expect(resultado.nome).toBe('Novo Nome');
  });

  it('remove candidato', async () => {
    (prisma.candidato.delete as jest.Mock).mockResolvedValue({ id: 1 });
    await service.remover(1);
    expect(prisma.candidato.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  describe('previewImportacao', () => {
    it('faz preview identificando candidatos válidos e setores inexistentes', async () => {
      (prisma.setor.findMany as jest.Mock).mockResolvedValue([
        { id: 10, nomeOficial: 'Secretaria de Saude', nomeExibido: 'Saúde' },
      ]);
      (prisma.eleitor.findMany as jest.Mock).mockResolvedValue([
        { id: 50, cpf: '52998224725', setorId: 10 },
      ]);
      (prisma.candidato.findMany as jest.Mock).mockResolvedValue([]);

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Candidatos');
      ws.addRow(['Nome Completo', 'Setor', 'Cargo', 'CPF']);
      ws.addRow(['Carlos Silva', 'Saúde', 'Enfermeiro', '529.982.247-25']);
      ws.addRow(['Ana Clara', 'Educação Inexistente', 'Professora', '']);
      const buffer = Buffer.from(await wb.xlsx.writeBuffer());

      const preview = await service.previewImportacao(1, buffer);

      expect(preview.totalLinhas).toBe(2);
      expect(preview.totalValidos).toBe(1);
      expect(preview.totalErros).toBe(1);
      expect(preview.setoresNaoEncontrados).toContain('Educação Inexistente');
      expect(preview.itens[0].status).toBe('valido');
      expect(preview.itens[0].setorId).toBe(10);
      expect(preview.itens[0].eleitorId).toBe(50);
      expect(preview.itens[1].status).toBe('erro');
    });
  });

  describe('confirmarImportacao', () => {
    it('insere candidatos em lote na transacao', async () => {
      (prisma.candidato.create as jest.Mock).mockResolvedValue({ id: 1 });

      const res = await service.confirmarImportacao({
        edicaoId: 1,
        candidatos: [
          { nome: 'Candidato 1', setorId: 10, cargo: 'Cargo 1', ordemExibicao: 1 },
          { nome: 'Candidato 2', setorId: 10, cargo: 'Cargo 2', ordemExibicao: 2 },
        ],
      });

      expect(res.totalImportados).toBe(2);
      expect(prisma.candidato.create).toHaveBeenCalledTimes(2);
    });

    it('bloqueia substituicao se ja houver votos na edicao', async () => {
      (prisma.voto.count as jest.Mock).mockResolvedValue(5);

      await expect(
        service.confirmarImportacao({
          edicaoId: 1,
          substituirExistentes: true,
          candidatos: [{ nome: 'Candidato 1', setorId: 10 }],
        })
      ).rejects.toThrow('já existem votos computados');
    });
  });

  describe('gerarModeloXlsx', () => {
    it('gera buffer de arquivo xlsx com modelo', async () => {
      (prisma.setor.findMany as jest.Mock).mockResolvedValue([
        { id: 1, nomeOficial: 'Gabinete', nomeExibido: 'Gabinete' },
      ]);

      const buffer = await service.gerarModeloXlsx(1);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
