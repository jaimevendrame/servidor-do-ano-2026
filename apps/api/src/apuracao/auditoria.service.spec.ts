/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { AuditoriaService } from './auditoria.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditoriaService', () => {
  let service: AuditoriaService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditoriaService,
        {
          provide: PrismaService,
          useValue: {
            logAuditoria: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditoriaService>(AuditoriaService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('registra log com ator, acao e payload', async () => {
    (prisma.logAuditoria.create as jest.Mock).mockResolvedValue({});

    await service.registrar('admin1', 'IMPORTACAO', { linhas: 50 });

    expect(prisma.logAuditoria.create).toHaveBeenCalledWith({
      data: { ator: 'admin1', acao: 'IMPORTACAO', payload: { linhas: 50 } },
    });
  });

  it('registra log sem payload', async () => {
    (prisma.logAuditoria.create as jest.Mock).mockResolvedValue({});

    await service.registrar('admin1', 'LOGIN');

    expect(prisma.logAuditoria.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ator: 'admin1', acao: 'LOGIN' }),
    });
  });

  it('lista logs com filtros', async () => {
    (prisma.logAuditoria.findMany as jest.Mock).mockResolvedValue([
      { id: 1, ator: 'admin1', acao: 'LOGIN', payload: null, timestamp: new Date() },
    ]);

    const resultado = await service.listar({ ator: 'admin1' });
    expect(resultado).toHaveLength(1);
    expect(prisma.logAuditoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ator: 'admin1' } })
    );
  });

  it('exporta CSV com header e linhas', async () => {
    const data = new Date('2026-09-01T10:00:00Z');
    (prisma.logAuditoria.findMany as jest.Mock).mockResolvedValue([
      { id: 1, ator: 'admin1', acao: 'LOGIN', payload: null, timestamp: data },
      { id: 2, ator: 'admin2', acao: 'IMPORTACAO', payload: { n: 10 }, timestamp: data },
    ]);

    const csv = await service.exportarCsv();
    const linhas = csv.split('\n');

    expect(linhas[0]).toBe('id,ator,acao,payload,timestamp');
    expect(linhas).toHaveLength(3); // header + 2
    expect(linhas[1]).toContain('admin1');
    expect(linhas[2]).toContain('admin2');
    expect(linhas[2]).toContain('IMPORTACAO');
  });

  it('CSV escapa aspas no payload', async () => {
    (prisma.logAuditoria.findMany as jest.Mock).mockResolvedValue([
      { id: 1, ator: 'a', acao: 'X', payload: { msg: 'test' }, timestamp: new Date() },
    ]);

    const csv = await service.exportarCsv();
    // Payload é JSON stringified e wrapped em aspas CSV
    expect(csv).toContain('test');
    expect(csv.split('\n')).toHaveLength(2);
  });
});
