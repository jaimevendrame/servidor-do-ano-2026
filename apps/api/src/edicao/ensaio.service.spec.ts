/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EnsaioService } from './ensaio.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EnsaioService', () => {
  let service: EnsaioService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnsaioService,
        {
          provide: PrismaService,
          useValue: {
            edicao: { findUnique: jest.fn() },
            voto: { count: jest.fn(), deleteMany: jest.fn() },
            participacao: { count: jest.fn(), deleteMany: jest.fn() },
            candidato: { count: jest.fn() },
            eleitor: { count: jest.fn() },
            setor: { count: jest.fn() },
            logAuditoria: { create: jest.fn() },
            $transaction: jest.fn((ops) => Promise.all(ops)),
          },
        },
      ],
    }).compile();

    service = module.get<EnsaioService>(EnsaioService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('previa', () => {
    it('rejeita edicao inexistente', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.previa(99)).rejects.toThrow(BadRequestException);
    });

    it('retorna as contagens sem alterar nada', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue({
        id: 7,
        janela: { abertaManual: false, fechadaManual: false },
      });
      (prisma.voto.count as jest.Mock).mockResolvedValue(12);
      (prisma.participacao.count as jest.Mock).mockResolvedValue(12);
      (prisma.candidato.count as jest.Mock).mockResolvedValue(225);
      (prisma.eleitor.count as jest.Mock).mockResolvedValue(3050);
      (prisma.setor.count as jest.Mock).mockResolvedValue(11);

      const previa = await service.previa(7);

      expect(previa.votos).toBe(12);
      expect(previa.candidatos).toBe(225);
      expect(previa.eleitores).toBe(3050);
      expect(previa.atencao).toBeNull();
      expect(prisma.voto.deleteMany).not.toHaveBeenCalled();
    });

    it('alerta quando a janela esta sob controle manual e ha votos', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue({
        id: 7,
        janela: { abertaManual: true, fechadaManual: false },
      });
      (prisma.voto.count as jest.Mock).mockResolvedValue(5);
      (prisma.participacao.count as jest.Mock).mockResolvedValue(5);
      (prisma.candidato.count as jest.Mock).mockResolvedValue(0);
      (prisma.eleitor.count as jest.Mock).mockResolvedValue(0);
      (prisma.setor.count as jest.Mock).mockResolvedValue(0);

      const previa = await service.previa(7);

      expect(previa.atencao).toContain('ENSAIO');
    });
  });

  describe('limpar', () => {
    it('apaga votos e participacoes, preservando a base de cadastro', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue({ id: 7 });
      (prisma.candidato.count as jest.Mock).mockResolvedValue(225);
      (prisma.eleitor.count as jest.Mock).mockResolvedValue(3050);
      (prisma.setor.count as jest.Mock).mockResolvedValue(11);
      (prisma.voto.deleteMany as jest.Mock).mockResolvedValue({ count: 12 });
      (prisma.participacao.deleteMany as jest.Mock).mockResolvedValue({ count: 12 });

      const resultado = await service.limpar(7, 'admin');

      expect(prisma.voto.deleteMany).toHaveBeenCalledWith({ where: { edicaoId: 7 } });
      expect(prisma.participacao.deleteMany).toHaveBeenCalledWith({ where: { edicaoId: 7 } });
      expect(resultado.votosRemovidos).toBe(12);
      expect(resultado.participacoesRemovidas).toBe(12);
      expect(resultado.candidatosPreservados).toBe(225);
      expect(resultado.eleitoresPreservados).toBe(3050);
      expect(resultado.setoresPreservados).toBe(11);
    });

    it('NUNCA apaga candidatos, eleitores ou setores', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue({ id: 7 });
      (prisma.candidato.count as jest.Mock).mockResolvedValue(225);
      (prisma.eleitor.count as jest.Mock).mockResolvedValue(3050);
      (prisma.setor.count as jest.Mock).mockResolvedValue(11);
      (prisma.voto.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });
      (prisma.participacao.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      await service.limpar(7, 'admin');

      expect(prisma.candidato.deleteMany).toBeUndefined();
      expect(prisma.eleitor.deleteMany).toBeUndefined();
      expect(prisma.setor.deleteMany).toBeUndefined();
      expect(prisma.edicao.deleteMany).toBeUndefined();
    });

    it('registra a acao na auditoria', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue({ id: 7 });
      (prisma.candidato.count as jest.Mock).mockResolvedValue(0);
      (prisma.eleitor.count as jest.Mock).mockResolvedValue(0);
      (prisma.setor.count as jest.Mock).mockResolvedValue(0);
      (prisma.voto.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.participacao.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.limpar(7, 'joao.admin');

      expect(prisma.logAuditoria.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ator: 'joao.admin',
          acao: 'ENSAIO_LIMPO',
        }),
      });
    });

    it('rejeita edicao inexistente', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.limpar(99, 'admin')).rejects.toThrow(BadRequestException);
      expect(prisma.voto.deleteMany).not.toHaveBeenCalled();
    });
  });
});
