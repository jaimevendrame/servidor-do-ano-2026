/* eslint-disable prettier/prettier */
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface AdminPayload {
  sub: number;
  username: string;
  tipo: string;
}

/**
 * Guard que exige um JWT válido de admin.
 * O token é assinado no login (admin.service) com { sub, username, tipo: 'admin' }.
 * Rejeita se ausente, inválido, expirado ou se tipo !== 'admin'.
 *
 * O username do admin autenticado fica disponível em req.adminUsername
 * para uso como "ator" nos logs de auditoria.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de admin ausente');
    }

    const token = authHeader.substring(7);

    let payload: AdminPayload;
    try {
      payload = this.jwtService.verify<AdminPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    if (payload.tipo !== 'admin') {
      throw new UnauthorizedException('Acesso restrito a administradores');
    }

    // Disponibiliza o username para uso como "ator" na auditoria
    (request as Request & { adminUsername?: string }).adminUsername = payload.username;

    return true;
  }
}
