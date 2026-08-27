# Scripts de Backup do Postgres

Backup manual antes da abertura da votacao (PRD §11). Complementa o backup
scheduled do Coolify — este e para o dump de seguranca pre-abertura.

## Scripts

| Script | Funcao |
|--------|--------|
| `backup.sh` | Gera dump comprimido do Postgres |
| `restore.sh` | Restaura um backup (sobrescreve o banco) |
| `test-restore.sh` | Testa restauracao em container efemero (nao toca no banco real) |

## Uso

### Backup antes da abertura

```bash
cd infra/scripts
./backup.sh backup_pre_abertura.sql.gz
```

### Testar que o backup e restauravel (OBRIGATORIO antes da abertura)

```bash
./test-restore.sh ./backups/backup_pre_abertura.sql.gz
```

O teste sobe um Postgres efemero, restaura o backup, conta as tabelas e destroi
o container. Nao toca no banco de producao.

### Restaurar em emergencia

```bash
./restore.sh ./backups/backup_pre_abertura.sql.gz
```

## Variaveis de ambiente

| Variavel | Default |
|----------|---------|
| `DB_CONTAINER` | servidor-do-ano-postgres-1 |
| `POSTGRES_DB` | servidor_do_ano |
| `POSTGRES_USER` | postgres |
| `BACKUP_DIR` | ./backups |

## Checklist pre-abertura (PRD §11)

1. [ ] Rodar `backup.sh` e guardar o dump
2. [ ] Rodar `test-restore.sh` e confirmar SUCESSO
3. [ ] Guardar o backup em local seguro (fora do VPS)

## Ensaio ponta a ponta (PRD §13 item 9)

Script que simula votacao completa: seed → abrir janela → 30 votos → fechar → apurar → expurgar.

```bash
cd apps/api
npx ts-node ../../infra/scripts/ensaio.ts
```

O script:
- Cria 30 eleitores fictícios em 3 setores
- Registra 30 votos (participacao + voto em transacao, sem vinculo)
- Apura ranking por setor com deteccao de empate
- Verifica integridade (regras #2, #3)
- Expurga TODOS os dados ao final (nada persiste)

Nenhum dado real de servidor utilizado.
