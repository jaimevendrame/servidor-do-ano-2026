/* eslint-disable prettier/prettier */
export class LoginEleitorDto {
  cpf!: string;
  dataAdmissao!: string; // YYYY-MM-DD
  edicaoId!: number; // eleição resolvida a partir do slug no frontend
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
