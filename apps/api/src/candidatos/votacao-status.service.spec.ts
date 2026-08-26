/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { VotacaoStatusService } from './votacao-status.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VotacaoStatusService', () => {
  let service: VotacaoStatusService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotacaoStatusService,
        {
          provide: PrismaService,
          useValue: {
            candidato: { count: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<VotacaoStatusService>(VotacaoStatusService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('setorEhVotavel', () => {
    it('setor com 0 candidatos nao eh votavel', async () => {
      (prisma.candidato.count as jest.Mock).mockResolvedValue(0);
      expect(await service.setorEhVotavel(1, 1)).toBe(false);
    });

    it('setor com 1 candidato nao eh votavel', async () => {
      (prisma.candidato.count as jest.Mock).mockResolvedValue(1);
      expect(await service.setorEhVotavel(1, 1)).toBe(false);
    });

    it('setor com 2 candidatos eh votavel', async () => {
      (prisma.candidato.count as jest.Mock).mockResolvedValue(2);
      expect(await service.setorEhVotavel(1, 1)).toBe(true);
    });

    it('setor com muitos candidatos eh votavel', async () => {
      (prisma.candidato.count as jest.Mock).mockResolvedValue(10);
      expect(await service.setorEhVotavel(1, 1)).toBe(true);
    });
  });

  describe('motivoSetorNaoVotavel', () => {
    it('retorna SETOR_SEM_CANDIDATOS quando zero', async () => {
      (prisma.candidato.count as jest.Mock).mockResolvedValue(0);
      expect(await service.motivoSetorNaoVotavel(1, 1)).toBe('SETOR_SEM_CANDIDATOS');
    });

    it('retorna SETOR_COM_UM_CANDIDATO quando exatamente 1', async () => {
      (prisma.candidato.count as jest.Mock).mockResolvedValue(1);
      expect(await service.motivoSetorNaoVotavel(1, 1)).toBe('SETOR_COM_UM_CANDIDATO');
    });

    it('retorna null quando setor eh votavel', async () => {
      (prisma.candidato.count as jest.Mock).mockResolvedValue(2);
      expect(await service.motivoSetorNaoVotavel(1, 1)).toBeNull();
    });
  });
});