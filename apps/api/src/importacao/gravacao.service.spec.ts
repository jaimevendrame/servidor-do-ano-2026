/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { GravacaoService } from './gravacao.service';
import { PrismaService } from '../prisma/prisma.service';
import { LinhaValidada } from './validar-linhas';
import { SetorNormalizado } from './normalizar-setores';

describe('GravacaoService', () => {
  let service: GravacaoService;
  let prisma: PrismaService;

  const setores: SetorNormalizado[] = [
    { nomeOficial: 'TI', nomeExibido: 'TI', agrupado: false, totalServidores: 2, origens: ['TI', 'T.I.'] },
    { nomeOficial: 'Agrupados', nomeExibido: 'Agrupados', agrupado: true, totalServidores: 1, origens: ['Juridico'] },
  ];

  const linhas: LinhaValidada[] = [
    { nome: 'Maria', cpf: '11111111111', dataNascimento: undefined, dataAdmissao: '2020-01-01', cargo: 'Dev', setor: 'TI', linhaOriginal: 2 },
    { nome: 'Joao', cpf: '22222222222', dataNascimento: undefined, dataAdmissao: '2018-05-01', cargo: 'Infra', setor: 'T.I.', linhaOriginal: 3 },
    { nome: 'Ana', cpf: '33333333333', dataNascimento: undefined, dataAdmissao: '2019-06-01', cargo: 'Adv', setor: 'Juridico', linhaOriginal: 4 },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GravacaoService,
        {
          provide: PrismaService,
          useValue: {
            janelaVotacao: { findUnique: jest.fn().mockResolvedValue(null) },
            setor: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
            eleitor: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn(), update: jest.fn() },
            logAuditoria: { create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<GravacaoService>(GravacaoService);
    prisma = module.get<PrismaService>(PrismaService);

    // Mock setor.create retorna id incremental
    let setorId = 1;
    (prisma.setor.create as jest.Mock).mockImplementation(() => ({ id: setorId++, edicaoId: 1 }));
  });

  it('bloqueia se votacao aberta', async () => {
    const agora = new Date();
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date(agora.getTime() - 60000),
      dataFim: new Date(agora.getTime() + 60000),
      abertaManual: false,
      fechadaManual: false,
    });

    await expect(service.gravar(1, linhas, setores, 'admin')).rejects.toThrow('bloqueada');
  });

  it('cria setores novos', async () => {
    const resultado = await service.gravar(1, linhas, setores, 'admin');

    expect(resultado.setoresCriados).toBe(2);
    expect(prisma.setor.create).toHaveBeenCalledTimes(2);
  });

  it('nao recria setor existente', async () => {
    (prisma.setor.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: 10, nomeOficial: 'TI' }) // TI existe
      .mockResolvedValueOnce(null); // Agrupados nao existe

    const resultado = await service.gravar(1, linhas, setores, 'admin');
    expect(resultado.setoresCriados).toBe(1); // so Agrupados
  });

  it('insere eleitores novos', async () => {
    const resultado = await service.gravar(1, linhas, setores, 'admin');

    expect(resultado.eleitoresNovos).toBe(3);
    expect(resultado.eleitoresAtualizados).toBe(0);
    expect(prisma.eleitor.create).toHaveBeenCalledTimes(3);
  });

  it('atualiza eleitor existente (setor prevalece da ultima importacao)', async () => {
    (prisma.eleitor.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: 99, cpf: '11111111111', setorId: 5 }) // Maria existe
      .mockResolvedValueOnce(null) // Joao novo
      .mockResolvedValueOnce(null); // Ana nova

    const resultado = await service.gravar(1, linhas, setores, 'admin');

    expect(resultado.eleitoresAtualizados).toBe(1);
    expect(resultado.eleitoresNovos).toBe(2);
    expect(prisma.eleitor.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 99 } })
    );
  });

  it('registra log de auditoria', async () => {
    await service.gravar(1, linhas, setores, 'admin1');

    expect(prisma.logAuditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ator: 'admin1',
        acao: 'IMPORTACAO_GRAVADA',
      }),
    });
  });

  it('permite importacao se votacao fechada', async () => {
    (prisma.janelaVotacao.findUnique as jest.Mock).mockResolvedValue({
      dataInicio: new Date('2020-01-01'),
      dataFim: new Date('2020-01-02'),
      abertaManual: false,
      fechadaManual: true,
    });

    const resultado = await service.gravar(1, linhas, setores, 'admin');
    expect(resultado.totalProcessados).toBe(3);
  });
});
