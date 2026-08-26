# Servidor do Ano 2026

Sistema de votação interna da premiação "Servidor do Ano" da prefeitura.

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Git

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Subir containers (Postgres + Redis)
docker compose up -d

# 3. Copiar variáveis de ambiente
cp .env.example apps/api/.env

# 4. Rodar migrações (quando houver schema)
npm run db:migrate

# 5. Subir dev (web + api em paralelo)
npm run dev
```

## Portas

| Serviço    | Porta |
|------------|-------|
| Web (Next.js) | 3000 |
| API (NestJS)  | 3001 |
| PostgreSQL    | 5432 |
| Redis         | 6379 |

## Comandos

```bash
npm run dev           # web + api em watch mode
npm run lint          # ESLint
npm run test          # testes unitários
npm run db:migrate    # aplicar migrações
npm run db:seed       # popular base de dev
```

## Estrutura

```
apps/
  web/   — Frontend Next.js (App Router)
  api/   — Backend NestJS + Prisma
docs/    — PRD e documentação
infra/   — Stack de deploy (Swarm/Traefik)
```

## Documentação

- [PRD completo](docs/PRD.md)
- [Convenções e regras de domínio](CLAUDE.md)
