/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { generateSecret, generateCode } from './totp';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: {
            admin: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(() => 'mock-admin-token') },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('login', () => {
    it('login basico sem TOTP retorna token', async () => {
      const senhaHash = await bcrypt.hash('senha123', 10);
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
        id: 1, username: 'admin', senhaHash, totpHabilitado: false, totpSecret: null,
      });

      const resultado = await service.login('admin', 'senha123');
      expect(resultado.token).toBe('mock-admin-token');
      expect(resultado.totpRequired).toBe(false);
    });

    it('login com TOTP habilitado exige codigo', async () => {
      const senhaHash = await bcrypt.hash('senha123', 10);
      const secret = generateSecret();
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
        id: 1, username: 'admin', senhaHash, totpHabilitado: true, totpSecret: secret,
      });

      const resultado = await service.login('admin', 'senha123');
      expect(resultado.token).toBe('');
      expect(resultado.totpRequired).toBe(true);
    });

    it('login com TOTP e codigo valido retorna token', async () => {
      const senhaHash = await bcrypt.hash('senha123', 10);
      const secret = generateSecret();
      const code = generateCode(secret);
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
        id: 1, username: 'admin', senhaHash, totpHabilitado: true, totpSecret: secret,
      });

      const resultado = await service.login('admin', 'senha123', code);
      expect(resultado.token).toBe('mock-admin-token');
    });

    it('rejeita senha invalida', async () => {
      const senhaHash = await bcrypt.hash('senha-correta', 10);
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
        id: 1, username: 'admin', senhaHash, totpHabilitado: false,
      });

      await expect(service.login('admin', 'senha-errada')).rejects.toThrow();
    });

    it('rejeita TOTP code invalido', async () => {
      const senhaHash = await bcrypt.hash('senha123', 10);
      const secret = generateSecret();
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
        id: 1, username: 'admin', senhaHash, totpHabilitado: true, totpSecret: secret,
      });

      await expect(service.login('admin', 'senha123', '000000')).rejects.toThrow();
    });
  });

  describe('setupTotp', () => {
    it('gera secret e QR code', async () => {
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
        id: 1, username: 'admin', totpSecret: null,
      });

      const resultado = await service.setupTotp(1);
      expect(resultado.secret).toBeTruthy();
      expect(resultado.qrCode).toMatch(/^data:image\/png;base64,/);
      expect(prisma.admin.update).toHaveBeenCalled();
    });

    it('falha se admin nao existe', async () => {
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.setupTotp(999)).rejects.toThrow();
    });
  });

  describe('confirmarTotp', () => {
    it('habilita TOTP com codigo valido', async () => {
      const secret = generateSecret();
      const code = generateCode(secret);
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
        id: 1, username: 'admin', totpSecret: secret, totpHabilitado: false,
      });

      await service.confirmarTotp(1, code);
      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { totpHabilitado: true },
      });
    });

    it('rejeita codigo invalido', async () => {
      const secret = generateSecret();
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
        id: 1, username: 'admin', totpSecret: secret, totpHabilitado: false,
      });

      await expect(service.confirmarTotp(1, '000000')).rejects.toThrow();
    });
  });
});
