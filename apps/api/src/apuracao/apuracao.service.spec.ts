/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { ApuracaoService } from './apuracao.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ApuracaoService', () => {
  let service: ApuracaoService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApuracaoService,
        {
          provide: PrismaService,
          useValue: {
            janelaVotacao: { findUnique: jest.fn() },
            setor: { findMany: jest.fn() },
            candidato: { findMany: jest.fn() },
            voto: { count: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<ApuracaoService>(ApuracaoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('rejeita apuracao se votacao aberta', async () => {
    const agora = new Date();
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date(agora.getTime() - 60000),
      dataFim: new Date(agora.getTime() + 60000),
      abertaManual: false,
      fechadaManual: false,
    });

    await expect(service.apurar(1)).rejects.toThrow('fechamento');
  });

  it('retorna ranking por setor apos fechamento', async () => {
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date('2020-01-01'),
      dataFim: new Date('2020-01-02'),
      abertaManual: false,
      fechadaManual: true,
    });
    (prisma.setor.findMany as jest.Mock).mockResolvedValue([
      { id: 1, nomeExibido: 'TI' },
    ]);
    (prisma.candidato.findMany as jest.Mock).mockResolvedValue([
      { id: 10, nome: 'Maria', cargo: 'Dev' },
      { id: 11, nome: 'Joao', cargo: 'Infra' },
    ]);
    (prisma.voto.count as jest.Mock)
      .mockResolvedValueOnce(5) // Maria
      .mockResolvedValueOnce(3); // Joao

    const resultado = await service.apurar(1);

    expect(resultado.setores).toHaveLength(1);
    expect(resultado.setores[0].ranking[0].nome).toBe('Maria');
    expect(resultado.setores[0].ranking[0].votos).toBe(5);
    expect(resultado.setores[0].empate).toBe(false);
  });

  it('sinaliza empate no topo sem resolver (regra #8)', async () => {
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date('2020-01-01'),
      dataFim: new Date('2020-01-02'),
      abertaManual: false,
      fechadaManual: true,
    });
    (prisma.setor.findMany as jest.Mock).mockResolvedValue([
      { id: 1, nomeExibido: 'Admin' },
    ]);
    (prisma.candidato.findMany as jest.Mock).mockResolvedValue([
      { id: 10, nome: 'A', cargo: null },
      { id: 11, nome: 'B', cargo: null },
      { id: 12, nome: 'C', cargo: null },
    ]);
    (prisma.voto.count as jest.Mock)
      .mockResolvedValueOnce(5) // A
      .mockResolvedValueOnce(5) // B — empate
      .mockResolvedValueOnce(2); // C

    const resultado = await service.apurar(1);

    expect(resultado.setores[0].empate).toBe(true);
    expect(resultado.setores[0].empatados).toHaveLength(2);
    expect(resultado.setores[0].empatados[0].votos).toBe(5);
    expect(resultado.setores[0].empatados[1].votos).toBe(5);
    // Sistema NAO escolhe vencedor
  });

  it('empate false quando vencedor unico', async () => {
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date('2020-01-01'),
      dataFim: new Date('2020-01-02'),
      abertaManual: false,
      fechadaManual: true,
    });
    (prisma.setor.findMany as jest.Mock).mockResolvedValue([
      { id: 1, nomeExibido: 'Saude' },
    ]);
    (prisma.candidato.findMany as jest.Mock).mockResolvedValue([
      { id: 10, nome: 'X', cargo: null },
      { id: 11, nome: 'Y', cargo: null },
    ]);
    (prisma.voto.count as jest.Mock)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3);

    const resultado = await service.apurar(1);

    expect(resultado.setores[0].empate).toBe(false);
    expect(resultado.setores[0].empatados).toHaveLength(0);
  });
});
