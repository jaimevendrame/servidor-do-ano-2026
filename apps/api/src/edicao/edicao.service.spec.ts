/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { EdicaoService, gerarSlug } from './edicao.service';
import { PrismaService } from '../prisma/prisma.service';

describe('gerarSlug', () => {
  it('gera slug com ano e cidade normalizada', () => {
    expect(gerarSlug(2027, 'Campo Mourão')).toBe('servidordoano2027campomourao');
  });

  it('remove acentos e caracteres especiais', () => {
    expect(gerarSlug(2026, 'São José dos Pinhais')).toBe('servidordoano2026saojosedospinhais');
  });

  it('funciona sem cidade', () => {
    expect(gerarSlug(2025)).toBe('servidordoano2025');
  });
});

describe('EdicaoService', () => {
  let service: EdicaoService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EdicaoService,
        {
          provide: PrismaService,
          useValue: {
            edicao: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EdicaoService>(EdicaoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('criar', () => {
    it('cria eleicao com slug automatico', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue(null); // ano livre + slug livre
      (prisma.edicao.create as jest.Mock).mockResolvedValue({
        id: 2,
        ano: 2027,
        slug: 'servidordoano2027campomourao',
        nomePrefeitura: 'Prefeitura de Campo Mourão',
        cidade: 'Campo Mourão',
        descricao: null,
        ativo: true,
        criadoEm: new Date(),
      });

      const r = await service.criar({
        ano: 2027,
        nomePrefeitura: 'Prefeitura de Campo Mourão',
        cidade: 'Campo Mourão',
      });

      expect(r.slug).toBe('servidordoano2027campomourao');
      expect(r.nomePrefeitura).toBe('Prefeitura de Campo Mourão');
      expect(prisma.edicao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ano: 2027,
            slug: 'servidordoano2027campomourao',
            ativo: true,
          }),
        })
      );
    });

    it('rejeita ano duplicado', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue({ id: 1, ano: 2026 });
      await expect(
        service.criar({ ano: 2026, nomePrefeitura: 'X' })
      ).rejects.toThrow(/ja existe|já existe/);
      expect(prisma.edicao.create).not.toHaveBeenCalled();
    });
  });

  describe('listarAtivas', () => {
    it('marca statusVotacao=aberta quando dentro da janela', async () => {
      const agora = new Date();
      (prisma.edicao.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1, ano: 2026, slug: 'servidordoano2026', nomePrefeitura: 'P', cidade: null,
          descricao: null, ativo: true, criadoEm: new Date(),
          janela: {
            dataInicio: new Date(agora.getTime() - 60000),
            dataFim: new Date(agora.getTime() + 60000),
            abertaManual: false, fechadaManual: false,
          },
        },
      ]);

      const r = await service.listarAtivas();
      expect(r[0].statusVotacao).toBe('aberta');
      expect(r[0].vigencia).not.toBeNull();
    });

    it('marca em_breve quando antes da janela', async () => {
      const agora = new Date();
      (prisma.edicao.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1, ano: 2027, slug: 's', nomePrefeitura: 'P', cidade: null,
          descricao: null, ativo: true, criadoEm: new Date(),
          janela: {
            dataInicio: new Date(agora.getTime() + 86400000),
            dataFim: new Date(agora.getTime() + 172800000),
            abertaManual: false, fechadaManual: false,
          },
        },
      ]);

      const r = await service.listarAtivas();
      expect(r[0].statusVotacao).toBe('em_breve');
    });

    it('marca sem_janela quando nao ha janela', async () => {
      (prisma.edicao.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1, ano: 2028, slug: 's', nomePrefeitura: 'P', cidade: null,
          descricao: null, ativo: true, criadoEm: new Date(), janela: null,
        },
      ]);

      const r = await service.listarAtivas();
      expect(r[0].statusVotacao).toBe('sem_janela');
      expect(r[0].vigencia).toBeNull();
    });
  });

  describe('obterPorSlug', () => {
    it('retorna eleicao por slug', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue({
        id: 1, ano: 2026, slug: 'servidordoano2026', nomePrefeitura: 'P',
        cidade: null, descricao: null, ativo: true, criadoEm: new Date(),
      });
      const r = await service.obterPorSlug('servidordoano2026');
      expect(r.slug).toBe('servidordoano2026');
    });

    it('lanca erro quando slug nao existe', async () => {
      (prisma.edicao.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.obterPorSlug('inexistente')).rejects.toThrow(/nao encontrada|não encontrada/);
    });
  });
});
