/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: { eleitor: { findFirst: jest.fn() } },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(() => 'mock-token') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('retorna token para eleitor valido', async () => {
    const eleitor = {
      id: 1,
      nome: 'Maria',
      cpf: '52998224725',
      edicaoId: 1,
      setorId: 1,
      dataAdmissao: new Date('2015-03-20'),
      cargo: 'Analista',
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      setor: { nomeExibido: 'Admin' },
    };

    (prisma.eleitor.findFirst as jest.Mock).mockResolvedValue(eleitor);

    const resultado = await service.loginEleitor(
      { cpf: '529.982.247-25', dataAdmissao: '2015-03-20' },
      1
    );

    expect(resultado.token).toBe('mock-token');
    expect(resultado.eleitor.nome).toBe('Maria');
  });

  it('lanca erro para eleitor nao encontrado', async () => {
    (prisma.eleitor.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      service.loginEleitor(
        { cpf: '999.999.999-99', dataAdmissao: '2000-01-01' },
        1
      )
    ).rejects.toThrow();
  });
});
