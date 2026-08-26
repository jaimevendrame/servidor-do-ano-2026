/* eslint-disable prettier/prettier */
export class LoginAdminDto {
  username!: string;
  senha!: string;
  totpCode?: string;
}

export class AdminTotpVerifyDto {
  adminId!: number;
  code!: string;
}
