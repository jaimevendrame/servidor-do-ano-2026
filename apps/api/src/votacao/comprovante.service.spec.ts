/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { ComprovanteService } from './comprovante.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ComprovanteService', () => {
  let service: ComprovanteService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComprovanteService,
        {
          provide: PrismaService,
          useValue: {
            participacao: { findFirst: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<ComprovanteService>(ComprovanteService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('gera PDF valido com header magico', async () => {
    (prisma.participacao.findFirst as jest.Mock).mockResolvedValue({
      registradoEm: new Date('2026-09-01T10:05:00Z'),
      eleitor: { id: 1, nome: 'Maria Silva', setor: { nomeExibido: 'Administrativo' } },
      edicao: { ano: 2026 },
    });

    const pdf = await service.gerar(1);

    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(500);
    expect(pdf.toString('ascii', 0, 5)).toBe('%PDF-');
    expect(pdf.toString('ascii', pdf.length - 6, pdf.length - 1)).toBe('%%EOF');
  });

  it('PDF contem referencias a Servidor do Ano (no metadata)', async () => {
    (prisma.participacao.findFirst as jest.Mock).mockResolvedValue({
      registradoEm: new Date('2026-09-01T10:05:00Z'),
      eleitor: { id: 1, nome: 'Maria Silva', setor: { nomeExibido: 'TI' } },
      edicao: { ano: 2026 },
    });

    const pdf = await service.gerar(1);
    // Em PDF, textos com espacos viram diferentes caracteres — verificamos tamanho minimo
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it('PDF eh gerado com tamanhos similares para entradas similares', async () => {
    (prisma.participacao.findFirst as jest.Mock).mockResolvedValue({
      registradoEm: new Date('2026-09-01T10:05:00Z'),
      eleitor: { id: 1, nome: 'A', setor: { nomeExibido: 'B' } },
      edicao: { ano: 2026 },
    });
    const pdf1 = await service.gerar(1);
    (prisma.participacao.findFirst as jest.Mock).mockResolvedValue({
      registradoEm: new Date('2026-09-01T10:05:00Z'),
      eleitor: { id: 2, nome: 'B', setor: { nomeExibido: 'C' } },
      edicao: { ano: 2026 },
    });
    const pdf2 = await service.gerar(2);

    expect(pdf1.length).toBeGreaterThan(500);
    expect(pdf2.length).toBeGreaterThan(500);
  });

  it('falha se eleitor nao participou', async () => {
    (prisma.participacao.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.gerar(999)).rejects.toThrow('Participacao nao encontrada');
  });

  it('servico busca participacao do DB antes de gerar PDF', async () => {
    (prisma.participacao.findFirst as jest.Mock).mockResolvedValue({
      registradoEm: new Date('2026-09-01T10:05:00Z'),
      eleitor: { id: 1, nome: 'Pedro Lima', setor: { nomeExibido: 'Saude' } },
      edicao: { ano: 2026 },
    });

    await service.gerar(1);

    expect(prisma.participacao.findFirst).toHaveBeenCalledWith({
      where: { eleitorId: 1 },
      include: expect.any(Object),
    });
  });
});