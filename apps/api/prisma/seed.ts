/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/pt_BR';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ID fixo da edicao — o frontend e o AuthController assumem edicaoId=1.
const EDICAO_ID = 1;

/**
 * Gera um CPF valido sintetico, ja limpo (11 digitos, sem mascara).
 *
 * IMPORTANTE:
 * - Digitos verificadores calculados corretamente (o front valida antes de enviar,
 *   e o backend so encontra o eleitor se o CPF bater).
 * - Retornado LIMPO porque o AuthService faz limparCPF(input) na busca; se o banco
 *   tivesse mascara, o login nunca casaria.
 */
function gerarCPF(): string {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));

  // Primeiro digito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += n[i] * (10 - i);
  let d1 = (soma * 10) % 11;
  if (d1 === 10) d1 = 0;

  // Segundo digito verificador
  soma = 0;
  const comD1 = [...n, d1];
  for (let i = 0; i < 10; i++) soma += comD1[i] * (11 - i);
  let d2 = (soma * 10) % 11;
  if (d2 === 10) d2 = 0;

  return [...n, d1, d2].join('');
}

/**
 * Gera CPFs validos e distintos (evita colisao de digitos).
 */
function gerarCPFsUnicos(quantidade: number): string[] {
  const set = new Set<string>();
  while (set.size < quantidade) {
    set.add(gerarCPF());
  }
  return Array.from(set);
}

async function seed(): Promise<void> {
  console.log('Limpando banco de dados...');
  await prisma.participacao.deleteMany({});
  await prisma.voto.deleteMany({});
  await prisma.candidato.deleteMany({});
  await prisma.eleitor.deleteMany({});
  await prisma.janelaVotacao.deleteMany({});
  await prisma.setor.deleteMany({});
  await prisma.logAuditoria.deleteMany({});
  await prisma.admin.deleteMany({});
  await prisma.edicao.deleteMany({});

  console.log('Criando edicao 2026 (id=1)...');
  const edicao = await prisma.edicao.create({
    data: {
      id: EDICAO_ID,
      ano: 2026,
      slug: 'servidordoano2026exemplo',
      nomePrefeitura: 'Prefeitura Municipal de Exemplo',
      cidade: 'Cidade Exemplo',
      descricao: 'Votacao anual para eleger o servidor destaque de cada setor.',
      ativo: true,
    },
  });

  console.log('Criando setores...');
  const setores = await Promise.all([
    prisma.setor.create({
      data: {
        edicaoId: edicao.id,
        nomeOficial: 'Administrativo',
        nomeExibido: 'Administrativo',
        agrupado: false,
      },
    }),
    prisma.setor.create({
      data: {
        edicaoId: edicao.id,
        nomeOficial: 'Tecnologia da Informacao',
        nomeExibido: 'TI',
        agrupado: false,
      },
    }),
    prisma.setor.create({
      data: {
        edicaoId: edicao.id,
        nomeOficial: 'Setores Pequenos Agrupados',
        nomeExibido: 'Guarda-chuva',
        agrupado: true,
      },
    }),
  ]);

  console.log('Gerando 30 eleitores com CPFs validos (limpos)...');
  const cpfs = gerarCPFsUnicos(30);
  const eleitores = [];
  for (let i = 0; i < 30; i++) {
    const setor = setores[i % 3];
    const eleitor = await prisma.eleitor.create({
      data: {
        edicaoId: edicao.id,
        setorId: setor.id,
        cpf: cpfs[i],
        nome: faker.person.fullName(),
        dataAdmissao: faker.date.past({ years: 10, refDate: new Date('2026-01-01') }),
        cargo: faker.person.jobTitle(),
      },
    });
    eleitores.push(eleitor);
  }

  console.log('Criando 5 candidatos por setor...');
  for (const setor of setores) {
    // Eleitores do setor, cada um usado no maximo uma vez como candidato
    // (constraint unica edicaoId+eleitorId). Os que sobrarem viram candidatos
    // "avulsos" sem vinculo a eleitor.
    const doSetor = eleitores.filter(e => e.setorId === setor.id);
    for (let i = 0; i < 5; i++) {
      const eleitorVinculado = doSetor[i];
      await prisma.candidato.create({
        data: {
          edicaoId: edicao.id,
          setorId: setor.id,
          eleitorId: eleitorVinculado?.id,
          nome: eleitorVinculado?.nome || faker.person.fullName(),
          cargo: faker.person.jobTitle(),
          ordemExibicao: i,
        },
      });
    }
  }

  console.log('Criando janela de votacao...');
  await prisma.janelaVotacao.create({
    data: {
      edicaoId: edicao.id,
      dataInicio: new Date('2026-09-01T08:00:00Z'),
      dataFim: new Date('2026-09-01T18:00:00Z'),
      timezone: 'America/Sao_Paulo',
      abertaManual: false,
      fechadaManual: false,
    },
  });

  console.log('Criando admin de desenvolvimento...');
  const senhaHash = await bcrypt.hash('admin123', 10);
  await prisma.admin.create({
    data: {
      username: 'admin',
      senhaHash,
      totpHabilitado: false,
    },
  });

  // Exibe um CPF de exemplo para facilitar o login em desenvolvimento.
  const exemplo = eleitores[0];
  const dataExemplo = exemplo.dataAdmissao.toISOString().slice(0, 10);

  console.log('Seed concluido.');
  console.log(`- 1 edicao (2026, id=${EDICAO_ID})`);
  console.log(`- 3 setores`);
  console.log(`- 30 eleitores`);
  console.log(`- 15 candidatos (5 por setor)`);
  console.log(`- 1 janela de votacao (fechada por padrao)`);
  console.log(`- 1 admin (usuario: admin / senha: admin123)`);
  console.log(`\nEleitor de exemplo para login:`);
  console.log(`  CPF: ${exemplo.cpf} | Data de admissao: ${dataExemplo}`);
  console.log(`\nNenhum dado real de servidor. CPFs e dados de candidatos gerados.`);
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
