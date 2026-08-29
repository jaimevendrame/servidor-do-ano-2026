/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginEleitorDto, LoginResponseDto } from './dto/login-eleitor.dto';
import { limparCPF } from '../importacao/validar-cpf';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly rateLimitService: RateLimitService
  ) {}

  async loginEleitor(dto: LoginEleitorDto, edicaoId: number): Promise<LoginResponseDto> {
    const cpfLimpo = limparCPF(dto.cpf);

    // Verifica bloqueio
    const bloqueado = await this.rateLimitService.estaBloqueado(cpfLimpo);
    if (bloqueado) {
      const ttl = await this.rateLimitService.tempoRestante(cpfLimpo);
      throw new Error(`CPF bloqueado. Tente novamente em ${Math.ceil(ttl / 60)} minutos.`);
    }

    const dataParse = new Date(dto.dataAdmissao);

    const eleitor = await this.prisma.eleitor.findFirst({
      where: {
        cpf: cpfLimpo,
        dataAdmissao: dataParse,
        edicaoId,
      },
      include: { setor: true },
    });

    if (!eleitor) {
      // Registra falha
      const resultado = await this.rateLimitService.registrarFalha(cpfLimpo);
      const msg = resultado.bloqueado
        ? 'CPF bloqueado por 15 minutos apos 3 tentativas invalidas.'
        : `Dados invalidos. Tentativa ${resultado.tentativas} de 3.`;
      throw new Error(msg);
    }

    // Valida status do eleitor
    if (eleitor.status === 'bloqueado') {
      const motivo = eleitor.motivoBloqueio ? ` Motivo: ${eleitor.motivoBloqueio}` : '';
      throw new Error(`Seu acesso foi revogado.${motivo}`);
    }

    // Sucesso: reseta contador
    await this.rateLimitService.resetar(cpfLimpo);

    const token = this.jwtService.sign(
      {
        sub: eleitor.id,
        cpf: eleitor.cpf,
        nome: eleitor.nome,
      },
      { expiresIn: '30m' }
    );

    return {
      token,
      eleitor: {
        id: eleitor.id,
        nome: eleitor.nome,
        cpf: eleitor.cpf,
        setor: eleitor.setor.nomeExibido,
      },
    };
  }
}
