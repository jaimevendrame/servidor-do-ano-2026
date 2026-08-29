/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { JanelaService } from './janela.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

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
              upsert: jest.fn(),
              findMany: jest.fn(),
            },
            logAuditoria: { create: jest.fn() },
            edicao: { findUnique: jest.fn(), findMany: jest.fn() },
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

  describe('atualizarDatas', () => {
    it('cria janela se não existe (upsert)', async () => {
      (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.janelaVotacao.upsert as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.logAuditoria.create as jest.Mock).mockResolvedValue({});

      const inicio = new Date('2030-01-01T08:00:00Z');
      const fim = new Date('2030-01-02T18:00:00Z');
      const resultado = await service.atualizarDatas(
        1,
        {
          dataInicio: inicio.toISOString(),
          dataFim: fim.toISOString(),
        },
        'admin1'
      );

      expect(resultado).toBeDefined();
      expect(prisma.janelaVotacao.upsert).toHaveBeenCalled();
      expect(prisma.logAuditoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            acao: 'JANELA_DATAS_ATUALIZADAS',
            ator: 'admin1',
          }),
        })
      );
    });

    it('rejeita se dataInicio >= dataFim', async () => {
      await expect(
        service.atualizarDatas(
          1,
          {
            dataInicio: '2030-01-02T08:00:00Z',
            dataFim: '2030-01-01T18:00:00Z',
          },
          'admin1'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita se datas inválidas', async () => {
      await expect(
        service.atualizarDatas(
          1,
          {
            dataInicio: 'invalida',
            dataFim: 'tambem-invalida',
          },
          'admin1'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita se janela está sob override manual', async () => {
      (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
        abertaManual: true,
        fechadaManual: false,
      });

      await expect(
        service.atualizarDatas(
          1,
          {
            dataInicio: '2030-01-01T08:00:00Z',
            dataFim: '2030-01-02T18:00:00Z',
          },
          'admin1'
        )
      ).rejects.toThrow(/controle manual/);
    });
  });

  describe('processarTransicoesAutomaticas', () => {
    it('fecha janela que passou de dataFim', async () => {
      const inicioPassado = new Date('2020-01-01T08:00:00Z');
      const fimPassado = new Date('2020-01-02T18:00:00Z');
      (prisma.janelaVotacao.findMany as jest.Mock).mockResolvedValue([
        {
          edicaoId: 1,
          dataInicio: inicioPassado,
          dataFim: fimPassado,
          abertaManual: false,
          fechadaManual: false,
          aberturaAutoRegistrada: true,
          fechamentoAutoRegistrado: false,
        },
      ]);
      (prisma.janelaVotacao.update as jest.Mock).mockResolvedValue({});
      (prisma.logAuditoria.create as jest.Mock).mockResolvedValue({});

      const agora = new Date('2020-01-03T12:00:00Z');
      const resultado = await service.processarTransicoesAutomaticas(agora);

      expect(resultado.fechamentos).toContain(1);
      expect(resultado.aberturas).toEqual([]);
      expect(prisma.logAuditoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ acao: 'JANELA_FECHADA_AUTOMATICA' }),
        })
      );
    });

    it('registra abertura automática na primeira passada dentro da janela', async () => {
      const inicioPassado = new Date('2020-01-01T08:00:00Z');
      const fimFuturo = new Date('2030-12-31T18:00:00Z');
      (prisma.janelaVotacao.findMany as jest.Mock).mockResolvedValue([
        {
          edicaoId: 2,
          dataInicio: inicioPassado,
          dataFim: fimFuturo,
          abertaManual: false,
          fechadaManual: false,
          aberturaAutoRegistrada: false,
          fechamentoAutoRegistrado: false,
        },
      ]);
      (prisma.janelaVotacao.update as jest.Mock).mockResolvedValue({});
      (prisma.logAuditoria.create as jest.Mock).mockResolvedValue({});

      const resultado = await service.processarTransicoesAutomaticas(
        new Date('2020-01-01T12:00:00Z')
      );

      expect(resultado.aberturas).toContain(2);
      expect(prisma.logAuditoria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ acao: 'JANELA_ABERTA_AUTOMATICA' }),
        })
      );
    });

    it('é idempotente: não re-registra abertura já registrada', async () => {
      (prisma.janelaVotacao.findMany as jest.Mock).mockResolvedValue([
        {
          edicaoId: 3,
          dataInicio: new Date('2020-01-01T08:00:00Z'),
          dataFim: new Date('2030-12-31T18:00:00Z'),
          abertaManual: false,
          fechadaManual: false,
          aberturaAutoRegistrada: true, // já registrado
          fechamentoAutoRegistrado: false,
        },
      ]);
      (prisma.logAuditoria.create as jest.Mock).mockResolvedValue({});

      const resultado = await service.processarTransicoesAutomaticas(
        new Date('2020-01-01T12:00:00Z')
      );

      expect(resultado.aberturas).toEqual([]);
      expect(prisma.logAuditoria.create).not.toHaveBeenCalled();
    });
  });
});
