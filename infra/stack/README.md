# Stack de Deploy — Docker Swarm + Traefik

## Pre-requisitos

- Docker Swarm inicializado (`docker swarm init`)
- Rede externa `network_public` criada:
  ```bash
  docker network create --driver overlay network_public
  ```
- Traefik rodando no cluster com resolver `letsencrypt` configurado

## Variaveis de ambiente

| Variavel | Descricao |
|----------|-----------|
| `DOMAIN` | Dominio do sistema (ex: votacao.prefeitura.gov.br) |
| `POSTGRES_PASSWORD` | Senha do Postgres |
| `JWT_SECRET` | Segredo JWT (forte, unico) |
| `ADMIN_TOTP_ISSUER` | Label TOTP (default: ServidorDoAno2026) |
| `REGISTRY` | Registry das imagens (default: ghcr.io) |
| `TAG` | Tag das imagens (default: latest) |

## Deploy manual

```bash
export DOMAIN=votacao.exemplo.gov.br
export POSTGRES_PASSWORD=senha-forte
export JWT_SECRET=segredo-forte
docker stack deploy -c docker-stack.yml servidor-do-ano
```

## Servicos

| Servico | Replicas | Rede | Porta |
|---------|----------|------|-------|
| web | 2 | network_public | 3000 |
| api | 2 | network_public + internal | 3001 |
| postgres | 1 (manager) | internal | 5432 |
| redis | 1 | internal | 6379 |

- **web** e **api** expostos via Traefik com TLS (letsencrypt)
- **postgres** e **redis** apenas na rede interna, sem exposicao externa
- Healthchecks em todos os servicos
