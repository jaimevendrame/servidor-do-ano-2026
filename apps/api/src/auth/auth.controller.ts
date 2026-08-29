/* eslint-disable prettier/prettier */
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginEleitorDto, LoginResponseDto } from './dto/login-eleitor.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('eleitor/login')
  async loginEleitor(@Body() dto: LoginEleitorDto): Promise<LoginResponseDto> {
    if (!dto.edicaoId || isNaN(Number(dto.edicaoId))) {
      throw new BadRequestException('Eleição não informada');
    }
    try {
      return await this.authService.loginEleitor(dto, Number(dto.edicaoId));
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Login falhou'
      );
    }
  }
}
