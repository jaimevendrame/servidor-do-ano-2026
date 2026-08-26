/* eslint-disable prettier/prettier */
export class LoginEleitorDto {
  cpf!: string;
  dataAdmissao!: string; // YYYY-MM-DD
}

export class LoginResponseDto {
  token!: string;
  eleitor!: {
    id: number;
    nome: string;
    cpf: string;
    setor: string;
  };
}
