#!/usr/bin/env bash
# Restaura backup do Postgres.
# Uso: ./restore.sh <arquivo.sql.gz>
# CUIDADO: sobrescreve TODOS os dados do banco.
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-servidor-do-ano-postgres-1}"
DB_NAME="${POSTGRES_DB:-servidor_do_ano}"
DB_USER="${POSTGRES_USER:-postgres}"

if [ $# -lt 1 ]; then
  echo "Uso: $0 <arquivo.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Arquivo nao encontrado: $BACKUP_FILE"
  exit 1
fi

echo "=== Restauracao do Postgres ==="
echo "Container: $DB_CONTAINER"
echo "Database:  $DB_NAME"
echo "Arquivo:   $BACKUP_FILE"
echo ""
echo "ATENCAO: Isso vai SOBRESCREVER todos os dados do banco '$DB_NAME'."
read -p "Continuar? (s/N): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
  echo "Cancelado."
  exit 0
fi

echo "Restaurando..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" --quiet

echo "Restauracao concluida."
