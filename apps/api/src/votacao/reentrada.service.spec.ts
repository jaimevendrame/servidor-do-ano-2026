/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { ReentradaService } from './reentrada.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReentradaService', () => {
  let service: ReentradaService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReentradaService,
        {
          provide: PrismaService,
          useValue: {
            participacao: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<ReentradaService>(ReentradaService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('retorna jaVotou=false se nao participou', async () => {
    (prisma.participacao.findUnique as jest.Mock).mockResolvedValue(null);

    const resultado = await service.obterStatus(1, 1);
    expect(resultado.jaVotou).toBe(false);
    expect(resultado.registradoEm).toBeNull();
  });

  it('retorna jaVotou=true com data se ja participou', async () => {
    const data = new Date('2026-09-01T10:05:00Z');
    (prisma.participacao.findUnique as jest.Mock).mockResolvedValue({
      eleitorId: 1, edicaoId: 1, registradoEm: data,
    });

    const resultado = await service.obterStatus(1, 1);
    expect(resultado.jaVotou).toBe(true);
    expect(resultado.registradoEm).toEqual(data);
  });

  it('NUNCA retorna informacao sobre o candidato votado', async () => {
    (prisma.participacao.findUnique as jest.Mock).mockResolvedValue({
      eleitorId: 1, edicaoId: 1, registradoEm: new Date(),
    });

    const resultado = await service.obterStatus(1, 1);

    // Tipo tem exatamente 2 campos: jaVotou e registradoEm
    const keys = Object.keys(resultado);
    expect(keys).toEqual(['jaVotou', 'registradoEm']);
    expect(keys).not.toContain('candidatoId');
    expect(keys).not.toContain('votoId');
    expect(keys).not.toContain('candidato');
  });
});
