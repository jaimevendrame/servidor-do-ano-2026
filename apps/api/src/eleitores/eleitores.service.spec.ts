/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { EleitorService } from './eleitores.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../apuracao/auditoria.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('EleitorService', () => {
  let service: EleitorService;
  let prisma: PrismaService;
  let auditoria: AuditoriaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EleitorService,
        {
          provide: PrismaService,
          useValue: {
            eleitor: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: AuditoriaService,
          useValue: {
            registrar: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EleitorService>(EleitorService);
    prisma = module.get<PrismaService>(PrismaService);
    auditoria = module.get<AuditoriaService>(AuditoriaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listar', () => {
    it('deve listar eleitores com filtros', async () => {
      const mockEleitores = [
        {
          id: 1,
          cpf: '12345678900',
          nome: 'Joao',
          status: 'ativo',
          motivoBloqueio: null,
          dataBloqueio: null,
          criadoEm: new Date(),
          setor: { nomeExibido: 'Setor A' },
        },
      ];

      (prisma.eleitor.count as jest.Mock).mockResolvedValue(1);
      (prisma.eleitor.findMany as jest.Mock).mockResolvedValue(mockEleitores);

      const resultado = await service.listar({ edicaoId: 1 });

      expect(resultado.total).toBe(1);
      expect(resultado.eleitores).toHaveLength(1);
      expect(resultado.eleitores[0].status).toBe('ativo');
    });

    it('deve rejeitar se edicaoId não informado', async () => {
      await expect(service.listar({ edicaoId: 0 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('bloquear', () => {
    it('deve bloquear eleitor e registrar em auditoria', async () => {
      const eleitor = {
        id: 1,
        cpf: '12345678900',
        nome: 'Joao',
        status: 'ativo',
        motivoBloqueio: null,
        dataBloqueio: null,
      };

      const updated = {
        ...eleitor,
        status: 'bloqueado',
        motivoBloqueio: 'Suspeita de fraude',
        dataBloqueio: new Date(),
      };

      (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue(eleitor);
      (prisma.eleitor.update as jest.Mock).mockResolvedValue(updated);
      (auditoria.registrar as jest.Mock).mockResolvedValue(undefined);

      const resultado = await service.bloquear(
        1,
        { motivoBloqueio: 'Suspeita de fraude' },
        'admin'
      );

      expect(resultado.status).toBe('bloqueado');
      expect(auditoria.registrar).toHaveBeenCalledWith(
        'admin',
        'ELEITOR_BLOQUEADO',
        expect.objectContaining({
          eleitorId: 1,
          cpf: '12345678900',
          motivo: 'Suspeita de fraude',
        })
      );
    });

    it('deve rejeitar se eleitor já está bloqueado', async () => {
      (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'bloqueado',
      });

      await expect(service.bloquear(1, { motivoBloqueio: 'Motivo' }, 'admin')).rejects.toThrow(
        BadRequestException
      );
    });

    it('deve rejeitar se motivo está vazio', async () => {
      (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'ativo',
      });

      await expect(service.bloquear(1, { motivoBloqueio: '' }, 'admin')).rejects.toThrow(
        BadRequestException
      );
    });

    it('deve rejeitar se eleitor não encontrado', async () => {
      (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.bloquear(999, { motivoBloqueio: 'Motivo' }, 'admin')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('desbloquear', () => {
    it('deve desbloquear eleitor e registrar em auditoria', async () => {
      const eleitor = {
        id: 1,
        cpf: '12345678900',
        nome: 'Joao',
        status: 'bloqueado',
        motivoBloqueio: 'Suspeita de fraude',
        dataBloqueio: new Date(),
      };

      const updated = {
        ...eleitor,
        status: 'ativo',
        motivoBloqueio: null,
        dataBloqueio: null,
      };

      (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue(eleitor);
      (prisma.eleitor.update as jest.Mock).mockResolvedValue(updated);
      (auditoria.registrar as jest.Mock).mockResolvedValue(undefined);

      const resultado = await service.desbloquear(1, 'admin');

      expect(resultado.status).toBe('ativo');
      expect(auditoria.registrar).toHaveBeenCalledWith(
        'admin',
        'ELEITOR_DESBLOQUEADO',
        expect.objectContaining({ eleitorId: 1, cpf: '12345678900' })
      );
    });

    it('deve rejeitar se eleitor já está ativo', async () => {
      (prisma.eleitor.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'ativo',
      });

      await expect(service.desbloquear(1, 'admin')).rejects.toThrow(BadRequestException);
    });
  });
});
