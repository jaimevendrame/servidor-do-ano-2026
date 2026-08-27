# Deploy — GitHub Actions + Portainer

## Secrets necessarios no GitHub

| Secret | Descricao |
|--------|-----------|
| `PORTAINER_URL` | URL base do Portainer (ex: https://portainer.exemplo.gov.br) |
| `PORTAINER_TOKEN` | API Token do Portainer (Settings → Access tokens) |
| `PORTAINER_STACK_ID` | ID numerico do stack no Portainer |
| `PORTAINER_ENDPOINT_ID` | ID do endpoint/environment no Portainer |

## Fluxo

1. Push na `main` (ou dispatch manual)
2. Build das imagens `api` e `web` via Docker multi-stage
3. Push para `ghcr.io/jaimevendrame/servidor-do-ano-2026/{api,web}:latest`
4. Chamada na API do Portainer p/ redeploy com pullImage=true
5. Portainer faz rolling update no stack Swarm

## Tokens do GHCR

O `GITHUB_TOKEN` automatico tem permissao de escrita no packages — nenhum PAT necessario.

## Rollback

Para rollback, basta trocar a tag no stack do Portainer:
```bash
# Via API
curl -X PUT ... -d '{"env": [{"name": "TAG", "value": "abc1234"}]}'
```

Ou via UI do Portainer: editar stack → trocar `TAG` → Update.
