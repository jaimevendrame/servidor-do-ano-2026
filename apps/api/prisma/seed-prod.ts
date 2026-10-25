/* eslint-disable prettier/prettier */
/**
 * Seed de PRODUÇÃO — idempotente.
 *
 * Cria apenas o que é essencial para o primeiro acesso:
 *   1. Edição 2026 (com dados oficiais configuráveis via env ou padrão seguro)
 *   2. Um setor inicial placeholder (edicaoId=1)
 *   3. Um admin com TOTP provisionado (imprime o segredo e a URL otpauth://)
 *
 * NÃO zera nenhuma tabela — pode ser rodado várias vezes sem perder dados.
 *
 * Como rodar em produção:
 *   docker exec -it $(docker ps -qf "name=api") npx prisma db seed
 *
 * Variáveis de ambiente (opcional, com defaults seguros):
 *   PROD_ADMIN_USERNAME         default: admin
 *   PROD_ADMIN_PASSWORD         default: Gerar-pelo-painel-apos-login
 *   PROD_ADMIN_TOTP_ISSUER      default: ServidorDoAno2026
 *   PROD_EDICAO_NOME_PREFEITURA default: Prefeitura Municipal
 *   PROD_EDICAO_CIDADE          default: (vazio)
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const EDICAO_ID = 1;
const EDICAO_ANO = new Date().getFullYear();

const ADMIN_USERNAME = process.env.PROD_ADMIN_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.PROD_ADMIN_PASSWORD ?? 'Trocar123!PrimeiroAcesso';
const TOTP_ISSUER = process.env.PROD_ADMIN_TOTP_ISSUER ?? 'ServidorDoAno2026';
const NOME_PREFEITURA = process.env.PROD_EDICAO_NOME_PREFEITURA ?? 'Prefeitura Municipal';
const CIDADE = process.env.PROD_EDICAO_CIDADE ?? '';

function gerarSecretBase32(tamanho = 20): string {
  // 20 bytes = 32 caracteres base32 (padrão RFC 6238 / Opus 5.5 Authenticator)
  const bytes = crypto.randomBytes(tamanho);
  return bytes.toString('base64').replace(/=+$/, '').slice(0, 32).toUpperCase();
}

function urlOtpauth(secret: string, account: string, issuer: string): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

async function seed(): Promise<void> {
  console.log('--- Seed de produção (idempotente) ---');

  // 1) Edição
  const edicao = await prisma.edicao.upsert({
    where: { id: EDICAO_ID },
    update: {},
    create: {
      id: EDICAO_ID,
      ano: EDICAO_ANO,
      slug: `servidordoano${EDICAO_ANO}`,
      nomePrefeitura: NOME_PREFEITURA,
      cidade: CIDADE || null,
      descricao: `Votação ${EDICAO_ANO} da premiação Servidor do Ano.`,
      ativo: true,
    },
  });
  console.log(`✓ Edição ${edicao.ano} (id=${edicao.id}) pronta`);

  // 2) Setor placeholder (somente se não existir nenhum)
  const setorCount = await prisma.setor.count({ where: { edicaoId: EDICAO_ID } });
  if (setorCount === 0) {
    await prisma.setor.create({
      data: {
        edicaoId: EDICAO_ID,
        nomeOficial: 'Setor Inicial',
        nomeExibido: 'Setor Inicial',
        agrupado: false,
      },
    });
    console.log('✓ Setor placeholder criado');
  } else {
    console.log(`✓ ${setorCount} setor(es) já existentes — não criou placeholder`);
  }

  // 3) Admin com TOTP (idempotente)
  const existente = await prisma.admin.findUnique({ where: { username: ADMIN_USERNAME } });
  if (existente) {
    console.log(`✓ Admin "${ADMIN_USERNAME}" já existe — seed finalizado sem alterações`);
    console.log('\n  Para reativar/regenerar o TOTP, remova o admin pelo painel e rode o seed novamente.');
    return;
  }

  const senhaHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const totpSecret = gerarSecretBase32();
  const otpauthUrl = urlOtpauth(totpSecret, ADMIN_USERNAME, TOTP_ISSUER);

  await prisma.admin.create({
    data: {
      username: ADMIN_USERNAME,
      senhaHash,
      totpSecret,
      totpHabilitado: false, // habilita no primeiro login
    },
  });

  console.log('\n=== ADMIN CRIADO ===');
  console.log(`  Usuário: ${ADMIN_USERNAME}`);
  console.log(`  Senha inicial: ${ADMIN_PASSWORD}`);
  console.log(`  TOTP secret (base32): ${totpSecret}`);
  console.log(`  TOTP issuer: ${TOTP_ISSUER}`);
  console.log(`  URL otpauth: ${otpauthUrl}`);
  console.log('\n  >>> Acesse https://servidordoano.com.br/admin/login');
  console.log('  >>> Faça login e cadastre o TOTP no app autenticador (Authy, 1Password, etc.)');
  console.log('  >>> Troque a senha inicial no primeiro acesso.\n');
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
