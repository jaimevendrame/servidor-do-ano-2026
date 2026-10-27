/* eslint-disable prettier/prettier */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface EleitorPayload {
  sub: number;
  cpf?: string;
  nome?: string;
  /** Tokens de admin carregam tipo: 'admin'. Tokens de eleitor nao carregam. */
  tipo?: string;
}

interface RequisicaoEleitor extends Request {
  body: { eleitorId?: number };
}

/**
 * Guard que exige um JWT valido de ELEITOR.
 *
 * Simetrico ao AdminAuthGuard. Diferencas:
 *  - Rejeita tokens de admin (tipo === 'admin'): os fluxos nao se misturam.
 *  - Exige que o elector autenticado seja o alvo da operacao:
 *      - rota com :eleitorId  -> payload.sub === params.eleitorId
 *      - POST /voto           -> payload.sub === body.eleitorId
 *
 * Sem isso, qualquer pessoa que descobrisse um eleitorId valido poderia
 * votar, baixar comprovante e consultar a participacao de terceiros.
 *
 * Ver issue #105.
 */
@Injectable()
export class EleitorAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequisicaoEleitor>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de eleitor ausente');
    }

    const token = authHeader.substring(7);

    let payload: EleitorPayload;
    try {
      payload = this.jwtService.verify<EleitorPayload>(token);
    } catch {
      throw new UnauthorizedException('Token invalido ou expirado');
    }

    // Token de admin nao serve para o fluxo do eleitor
    if (payload.tipo === 'admin') {
      throw new UnauthorizedException('Acesso restrito a eleitores');
    }

    // Alvo da operacao: parametro de rota (:eleitorId) ou corpo (POST /voto)
    const alvo = request.params?.eleitorId ?? request.body?.eleitorId;
    if (alvo === undefined || alvo === null || alvo === '') {
      throw new BadRequestException('Nao foi possivel identificar o eleitor da requisicao');
    }

    const idAlvo = Number(alvo);
    if (!Number.isInteger(idAlvo)) {
      throw new BadRequestException('Identificador de eleitor invalido');
    }

    if (payload.sub !== idAlvo) {
      throw new ForbiddenException('Operacao nao permitida para este eleitor');
    }

    return true;
  }
}
