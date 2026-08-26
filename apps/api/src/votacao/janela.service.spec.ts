/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { JanelaService } from './janela.service';
import { PrismaService } from '../prisma/prisma.service';

describe('JanelaService', () => {
  let service: JanelaService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JanelaService,
        {
          provide: PrismaService,
          useValue: {
            janelaVotacao: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            logAuditoria: { create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<JanelaService>(JanelaService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('status', () => {
    it('retorna null se janela nao existe', async () => {
      (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue(null);
      expect(await service.status(1)).toBeNull();
    });

    it('retorna aberta=true dentro da janela', async () => {
      const agora = new Date();
      (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
        dataInicio: new Date(agora.getTime() - 60000),
        dataFim: new Date(agora.getTime() + 60000),
        abertaManual: false,
        fechadaManual: false,
      });

      const resultado = await service.status(1);
      expect(resultado!.aberta).toBe(true);
    });

    it('retorna aberta=false fora da janela', async () => {
      (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
        dataInicio: new Date('2020-01-01'),
        dataFim: new Date('2020-01-02'),
        abertaManual: false,
        fechadaManual: false,
      });

      const resultado = await service.status(1);
      expect(resultado!.aberta).toBe(false);
    });

    it('abertaManual ignora janela temporal', async () => {
      (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
        dataInicio: new Date('2030-01-01'),
        dataFim: new Date('2030-01-02'),
        abertaManual: true,
        fechadaManual: false,
      });

      const resultado = await service.status(1);
      expect(resultado!.aberta).toBe(true);
    });

    it('fechadaManual sobrepoe tudo', async () => {
      const agora = new Date();
      (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
        dataInicio: new Date(agora.getTime() - 60000),
        dataFim: new Date(agora.getTime() + 60000),
        abertaManual: true,
        fechadaManual: true,
      });

      const resultado = await service.status(1);
      expect(resultado!.aberta).toBe(false);
    });
  });

  describe('abrirManual', () => {
    it('atualiza janela e registra log', async () => {
      (prisma.janelaVotacao.update as jest.Mock).mockResolvedValue({});
      (prisma.logAuditoria.create as jest.Mock).mockResolvedValue({});

      await service.abrirManual(1, 'admin1');

      expect(prisma.janelaVotacao.update).toHaveBeenCalledWith({
        where: { edicaoId: 1 },
        data: { abertaManual: true, fechadaManual: false },
      });
      expect(prisma.logAuditoria.create).toHaveBeenCalledWith({
        data: { ator: 'admin1', acao: 'JANELA_ABERTA_MANUAL', payload: { edicaoId: 1 } },
      });
    });
  });

  describe('fecharManual', () => {
    it('atualiza janela e registra log', async () => {
      (prisma.janelaVotacao.update as jest.Mock).mockResolvedValue({});
      (prisma.logAuditoria.create as jest.Mock).mockResolvedValue({});

      await service.fecharManual(1, 'admin1');

      expect(prisma.janelaVotacao.update).toHaveBeenCalledWith({
        where: { edicaoId: 1 },
        data: { fechadaManual: true },
      });
      expect(prisma.logAuditoria.create).toHaveBeenCalledWith({
        data: { ator: 'admin1', acao: 'JANELA_FECHADA_MANUAL', payload: { edicaoId: 1 } },
      });
    });
  });
});
