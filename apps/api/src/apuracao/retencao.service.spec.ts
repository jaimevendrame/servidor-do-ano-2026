/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { RetencaoService } from './retencao.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RetencaoService', () => {
  let service: RetencaoService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetencaoService,
        {
          provide: PrismaService,
          useValue: {
            edicao: { findUnique: jest.fn() },
            janelaVotacao: { findUnique: jest.fn() },
            participacao: { deleteMany: jest.fn() },
            voto: { deleteMany: jest.fn() },
            candidato: { deleteMany: jest.fn() },
            eleitor: { deleteMany: jest.fn() },
            logAuditoria: { deleteMany: jest.fn(), create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<RetencaoService>(RetencaoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('verificarElegibilidade', () => {
    it('nao elegivel se votacao nao fechou', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
        fechadaManual: false,
        atualizadoEm: new Date(),
      });

      const resultado = await service.verificarElegibilidade(1);
      expect(resultado.elegivel).toBe(false);
    });

    it('nao elegivel se menos de 90 dias', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
        fechadaManual: true,
        atualizadoEm: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias
      });

      const resultado = await service.verificarElegibilidade(1);
      expect(resultado.elegivel).toBe(false);
      expect(resultado.diasRestantes).toBe(60);
    });

    it('elegivel apos 90 dias', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
        fechadaManual: true,
        atualizadoEm: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 dias
      });

      const resultado = await service.verificarElegibilidade(1);
      expect(resultado.elegivel).toBe(true);
      expect(resultado.diasRestantes).toBe(0);
    });
  });

  describe('executar', () => {
    it('rejeita se nao elegivel', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
        fechadaManual: false,
        atualizadoEm: new Date(),
      });

      await expect(service.executar(1, 'admin')).rejects.toThrow('nao elegivel');
    });

    it('executa expurgo e retorna contagens', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
        fechadaManual: true,
        atualizadoEm: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      });
      (prisma.participacao.deleteMany as jest.Mock).mockResolvedValue({ count: 30 });
      (prisma.voto.deleteMany as jest.Mock).mockResolvedValue({ count: 30 });
      (prisma.candidato.deleteMany as jest.Mock).mockResolvedValue({ count: 15 });
      (prisma.eleitor.deleteMany as jest.Mock).mockResolvedValue({ count: 100 });
      (prisma.logAuditoria.deleteMany as jest.Mock).mockResolvedValue({ count: 50 });
      (prisma.logAuditoria.create as jest.Mock).mockResolvedValue({});

      const resultado = await service.executar(1, 'admin');

      expect(resultado.eleitoresRemovidos).toBe(100);
      expect(resultado.votosRemovidos).toBe(30);
      expect(resultado.participacoesRemovidas).toBe(30);
      expect(resultado.candidatosRemovidos).toBe(15);
      expect(resultado.logsRemovidos).toBe(50);
      expect(prisma.logAuditoria.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ acao: 'EXPURGO_RETENCAO' }) })
      );
    });
  });
});
