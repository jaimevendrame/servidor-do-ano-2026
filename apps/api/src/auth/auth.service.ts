/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginEleitorDto, LoginResponseDto } from './dto/login-eleitor.dto';
import { limparCPF } from '../importacao/validar-cpf';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async loginEleitor(dto: LoginEleitorDto, edicaoId: number): Promise<LoginResponseDto> {
    const cpfLimpo = limparCPF(dto.cpf);
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
      throw new Error('Eleitor nao encontrado ou dados invalidos');
    }

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
