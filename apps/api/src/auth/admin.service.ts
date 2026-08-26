/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as qrcode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { generateSecret, verifyCode, generateOtpAuthUri } from './totp';

const TOTP_ISSUER = process.env.ADMIN_TOTP_ISSUER || 'ServidorDoAno2026';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async criarAdmin(username: string, senha: string): Promise<{ id: number; username: string }> {
    const senhaHash = await bcrypt.hash(senha, 10);
    const admin = await this.prisma.admin.create({
      data: { username, senhaHash },
    });
    return { id: admin.id, username: admin.username };
  }

  async login(
    username: string,
    senha: string,
    totpCode?: string
  ): Promise<{ token: string; totpRequired: boolean }> {
    const admin = await this.prisma.admin.findUnique({ where: { username } });

    if (!admin || !(await bcrypt.compare(senha, admin.senhaHash))) {
      throw new Error('Usuario ou senha invalidos');
    }

    if (admin.totpHabilitado) {
      if (!totpCode) {
        return { token: '', totpRequired: true };
      }
      if (!verifyCode(admin.totpSecret || '', totpCode)) {
        throw new Error('Codigo TOTP invalido');
      }
    }

    const token = this.jwtService.sign(
      { sub: admin.id, username: admin.username, tipo: 'admin' },
      { expiresIn: '30m' }
    );

    return { token, totpRequired: false };
  }

  async setupTotp(adminId: number): Promise<{ secret: string; qrCode: string }> {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new Error('Admin nao encontrado');

    const secret = generateSecret();
    const otpauth = generateOtpAuthUri(admin.username, TOTP_ISSUER, secret);
    const qrCode = await qrcode.toDataURL(otpauth);

    await this.prisma.admin.update({
      where: { id: adminId },
      data: { totpSecret: secret, totpHabilitado: false },
    });

    return { secret, qrCode };
  }

  async confirmarTotp(adminId: number, code: string): Promise<void> {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new Error('Admin nao encontrado');
    if (!admin.totpSecret) throw new Error('TOTP nao foi inicializado');

    if (!verifyCode(admin.totpSecret, code)) {
      throw new Error('Codigo TOTP invalido');
    }

    await this.prisma.admin.update({
      where: { id: adminId },
      data: { totpHabilitado: true },
    });
  }
}
