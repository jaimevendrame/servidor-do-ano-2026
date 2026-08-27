# Deploy — Coolify (self-hosted PaaS)

## Pre-requisitos

- VPS com Coolify instalado (https://coolify.io/docs/installation)
- Repositório GitHub conectado como source no Coolify

## Setup no painel Coolify

### 1. Conectar repositório

1. Coolify → Sources → Add GitHub App (ou Public repo)
2. Selecionar `jaimevendrame/servidor-do-ano-2026`
3. Branch: `main`
4. Compose path: `infra/coolify/docker-compose.yml`

### 2. Configurar variaveis de ambiente

No painel do projeto, aba "Environment":

| Variavel | Descricao | Exemplo |
|----------|-----------|---------|
| `POSTGRES_PASSWORD` | Senha do Postgres | (gerar forte) |
| `JWT_SECRET` | Segredo JWT | (gerar forte, 64+ chars) |
| `ADMIN_TOTP_ISSUER` | Label do TOTP | ServidorDoAno2026 |
| `NEXT_PUBLIC_API_URL` | URL publica da API | https://votacao.prefeitura.gov.br/api |

### 3. Configurar domínio e TLS

1. Aba "Settings" → Domain: `votacao.prefeitura.gov.br`
2. Coolify configura automaticamente:
   - Reverse proxy (Traefik embutido)
   - Certificado Let's Encrypt
   - Renovação automática

### 4. Portas e rotas

| Servico | Porta interna | Rota publica |
|---------|---------------|--------------|
| web | 3000 | `/` (root) |
| api | 3001 | `/api` |

Configurar no Coolify: web como servico principal (porta 3000), api com path prefix `/api`.

## Fluxo de deploy

```
Push na main → Coolify detecta webhook → build dos Dockerfiles → deploy → healthcheck
```

Nenhum GitHub Actions necessario p/ deploy. O workflow `ci.yml` continua rodando lint/test/build nos PRs.

## Backup do Postgres

1. Coolify → Databases → servidor-do-ano postgres
2. Backups → Enable scheduled backup
3. Frequência: diário
4. Retenção: 90 dias (alinhado com LGPD, PRD §8.4)

## Rollback

No painel Coolify → Deployments → selecionar deploy anterior → Rollback.

## Monitoramento

- Healthchecks configurados em todos servicos (Coolify respeita)
- Logs acessiveis pelo painel (stdout/stderr de cada container)
- Coolify envia notificacoes de deploy (email, Discord, Slack)

## Diferenças vs setup anterior (Portainer/Swarm)

| Antes | Agora |
|-------|-------|
| Swarm multi-node | Docker standalone (single VPS) |
| Traefik manual | Traefik embutido no Coolify |
| GitHub Actions deploy.yml | Auto-deploy por webhook |
| Portainer UI + API | Coolify UI |
| 4 secrets no GitHub | Zero secrets (Coolify gerencia tudo) |
| Backup manual | Backup scheduled embutido |
