/* eslint-disable prettier/prettier */
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { LoginAdminDto, AdminTotpVerifyDto } from './dto/admin.dto';

@Controller('auth/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async login(@Body() dto: LoginAdminDto): Promise<{ token: string; totpRequired: boolean }> {
    try {
      return await this.adminService.login(dto.username, dto.senha, dto.totpCode);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Login admin falhou'
      );
    }
  }

  @Post('totp/setup')
  async setupTotp(@Body() body: { adminId: number }): Promise<{ secret: string; qrCode: string }> {
    try {
      return await this.adminService.setupTotp(body.adminId);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Setup TOTP falhou'
      );
    }
  }

  @Post('totp/verify')
  async verifyTotp(@Body() dto: AdminTotpVerifyDto): Promise<{ ok: boolean }> {
    try {
      await this.adminService.confirmarTotp(dto.adminId, dto.code);
      return { ok: true };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Verificacao TOTP falhou'
      );
    }
  }
}