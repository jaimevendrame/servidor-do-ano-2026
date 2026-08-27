#!/usr/bin/env bash
# Teste automatizado de restauracao: valida que um backup pode ser restaurado
# em um Postgres efemero. Usar antes da abertura da votacao (PRD §11).
#
# Uso: ./test-restore.sh <arquivo.sql.gz>
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Uso: $0 <arquivo.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
TEST_CONTAINER="pg-teste-restore-$$"
TEST_DB="teste_restore"
TEST_PASSWORD="teste123"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Arquivo nao encontrado: $BACKUP_FILE"
  exit 1
fi

echo "=== Teste de restauracao ==="
echo "Backup: $BACKUP_FILE"
echo ""

cleanup() {
  echo "Limpando container de teste..."
  docker rm -f "$TEST_CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "1. Subindo Postgres efemero..."
docker run -d --name "$TEST_CONTAINER" \
  -e POSTGRES_PASSWORD="$TEST_PASSWORD" \
  -e POSTGRES_DB="$TEST_DB" \
  postgres:16-alpine >/dev/null

echo "2. Aguardando Postgres ficar pronto..."
for i in $(seq 1 30); do
  if docker exec "$TEST_CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "3. Restaurando backup..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$TEST_CONTAINER" psql -U postgres -d "$TEST_DB" --quiet >/dev/null

echo "4. Verificando tabelas restauradas..."
TABELAS=$(docker exec "$TEST_CONTAINER" psql -U postgres -d "$TEST_DB" -t -c \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')

echo ""
if [ "$TABELAS" -gt 0 ]; then
  echo "SUCESSO: $TABELAS tabelas restauradas."
  exit 0
else
  echo "FALHA: nenhuma tabela restaurada."
  exit 1
fi
