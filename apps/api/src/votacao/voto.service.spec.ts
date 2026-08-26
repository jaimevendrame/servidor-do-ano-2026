/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { VotoService } from './voto.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VotoService', () => {
  let service: VotoService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotoService,
        {
          provide: PrismaService,
          useValue: {
            eleitor: { findUnique: jest.fn() },
            participacao: { findUnique: jest.fn(), create: jest.fn() },
            voto: { create: jest.fn() },
            candidato: { findFirst: jest.fn() },
            janelaVotacao: { findUnique: jest.fn() },
            $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
          },
        },
      ],
    }).compile();

    service = module.get<VotoService>(VotoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('rejeita se eleitor nao existe', async () => {
    (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.registrar({ eleitorId: 999, candidatoId: 1 })).rejects.toThrow('Eleitor nao encontrado');
  });

  it('idempotente: retorna sucesso com jaVotou=true se ja votou', async () => {
    (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({ id: 1, edicaoId: 1, setorId: 5 });
    (prisma.participacao.findUnique as jest.Mock).mockResolvedValue({ registradoEm: new Date() });

    const resultado = await service.registrar({ eleitorId: 1, candidatoId: 10 });
    expect(resultado.jaVotou).toBe(true);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita se janela nao configurada', async () => {
    (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({ id: 1, edicaoId: 1, setorId: 5 });
    (prisma.participacao.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.registrar({ eleitorId: 1, candidatoId: 10 })).rejects.toThrow('Janela');
  });

  it('rejeita se votacao fechada', async () => {
    (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({ id: 1, edicaoId: 1, setorId: 5 });
    (prisma.participacao.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-01-02'),
      abertaManual: false,
      fechadaManual: true,
    });

    await expect(service.registrar({ eleitorId: 1, candidatoId: 10 })).rejects.toThrow('aberta');
  });

  it('rejeita se candidato nao pertence ao setor', async () => {
    (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({ id: 1, edicaoId: 1, setorId: 5 });
    (prisma.participacao.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date('2020-01-01'),
      dataFim: new Date('2030-01-01'),
      abertaManual: false,
      fechadaManual: false,
    });
    (prisma.candidato.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.registrar({ eleitorId: 1, candidatoId: 999 })).rejects.toThrow('Candidato invalido');
  });

  it('registra voto e participacao na mesma transacao', async () => {
    (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({ id: 1, edicaoId: 1, setorId: 5 });
    (prisma.participacao.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date('2020-01-01'),
      dataFim: new Date('2030-01-01'),
      abertaManual: false,
      fechadaManual: false,
    });
    (prisma.candidato.findFirst as jest.Mock).mockResolvedValue({ id: 10, setorId: 5 });
    (prisma.participacao.create as jest.Mock).mockResolvedValue({});
    (prisma.voto.create as jest.Mock).mockResolvedValue({});

    const resultado = await service.registrar({ eleitorId: 1, candidatoId: 10 });

    expect(resultado.sucesso).toBe(true);
    expect(resultado.jaVotou).toBe(false);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.participacao.create).toHaveBeenCalled();
    expect(prisma.voto.create).toHaveBeenCalled();
  });

  it('aceita override admin com abertaManual', async () => {
    (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({ id: 1, edicaoId: 1, setorId: 5 });
    (prisma.participacao.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date('2030-01-01'),
      dataFim: new Date('2030-01-02'),
      abertaManual: true,
      fechadaManual: false,
    });
    (prisma.candidato.findFirst as jest.Mock).mockResolvedValue({ id: 10, setorId: 5 });
    (prisma.participacao.create as jest.Mock).mockResolvedValue({});
    (prisma.voto.create as jest.Mock).mockResolvedValue({});

    const resultado = await service.registrar({ eleitorId: 1, candidatoId: 10 });
    expect(resultado.sucesso).toBe(true);
  });
});