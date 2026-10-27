/* eslint-disable prettier/prettier */
import { ExecutionContext, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { EleitorAuthGuard } from './eleitor-auth.guard';

describe('EleitorAuthGuard', () => {
  let guard: EleitorAuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EleitorAuthGuard,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<EleitorAuthGuard>(EleitorAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  function contexto(opts: {
    authorization?: string;
    params?: Record<string, string>;
    body?: Record<string, unknown>;
  }): ExecutionContext {
    const request = {
      headers: opts.authorization ? { authorization: opts.authorization } : {},
      params: opts.params ?? {},
      body: opts.body ?? {},
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  const tokenEleitor = (sub: number) => `Bearer fake.${sub}.sig`;

  describe('autenticacao', () => {
    it('rejeita requisicao sem header Authorization', () => {
      expect(() => guard.canActivate(contexto({ params: { eleitorId: '1' } }))).toThrow(
        UnauthorizedException,
      );
    });

    it('rejeita header sem prefixo Bearer', () => {
      expect(() =>
        guard.canActivate(
          contexto({ authorization: 'abc.def.ghi', params: { eleitorId: '1' } }),
        ),
      ).toThrow(UnauthorizedException);
    });

    it('rejeita token invalido ou expirado', () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      expect(() =>
        guard.canActivate(
          contexto({ authorization: tokenEleitor(1), params: { Param: '1' } }),
        ),
      ).toThrow(UnauthorizedException);
    });

    it('rejeita token de admin no fluxo do eleitor', () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 1, tipo: 'admin' });

      expect(() =>
        guard.canActivate(
          contexto({ authorization: tokenEleitor(1), params: { eleitorId: '1' } }),
        ),
      ).toThrow(UnauthorizedException);
    });
  });

  describe('verificacao do alvo', () => {
    it('libera quando payload.sub bate com :eleitorId da rota', () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 42, cpf: '111' });

      expect(
        guard.canActivate(
          contexto({ authorization: tokenEleitor(42), params: { eleitorId: '42' } }),
        ),
      ).toBe(true);
    });

    it('libera quando payload.sub bate com body.eleitorId (POST /voto)', () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 42, cpf: '111' });

      expect(
        guard.canActivate(
          contexto({
            authorization: tokenEleitor(42),
            params: {},
            body: { eleitorId: 42, candidatoId: 7 },
          }),
        ),
      ).toBe(true);
    });

    it('rejeita token de um eleitor acessando dados de outro', () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 42, cpf: '111' });

      expect(() =>
        guard.canActivate(
          contexto({ authorization: tokenEleitor(42), params: { eleitorId: '99' } }),
        ),
      ).toThrow(ForbiddenException);
    });

    it('rejeita POST /voto com body.eleitorId de terceiro', () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 42, cpf: '111' });

      expect(() =>
        guard.canActivate(
          contexto({
            authorization: tokenEleitor(42),
            params: {},
            body: { eleitorId: 99, candidatoId: 7 },
          }),
        ),
      ).toThrow(ForbiddenException);
    });

    it('rejeita quando nao e possivel identificar o elector da requisicao', () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 42, cpf: '111' });

      expect(() =>
        guard.canActivate(contexto({ authorization: tokenEleitor(42), params: {}, body: {} })),
      ).toThrow(BadRequestException);
    });

    it('rejeita identificador de elector nao numerico', () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 42, cpf: '111' });

      expect(() =>
        guard.canActivate(
          contexto({ authorization: tokenEleitor(42), params: { eleitorId: 'abc' } }),
        ),
      ).toThrow(BadRequestException);
    });
  });
});
