#!/usr/bin/env bash
# Backup do Postgres antes da abertura da votação.
# Uso: ./backup.sh [nome_arquivo]
# Requer: pg_dump disponível (container ou host)
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-servidor-do-ano-postgres-1}"
DB_NAME="${POSTGRES_DB:-servidor_do_ano}"
DB_USER="${POSTGRES_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${1:-backup_${TIMESTAMP}.sql.gz}"

mkdir -p "$BACKUP_DIR"

echo "=== Backup do Postgres ==="
echo "Container: $DB_CONTAINER"
echo "Database:  $DB_NAME"
echo "Destino:   $BACKUP_DIR/$FILENAME"
echo ""

docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"

SIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
echo "Backup concluido: $BACKUP_DIR/$FILENAME ($SIZE)"
echo ""
echo "Para restaurar:"
echo "  ./restore.sh $BACKUP_DIR/$FILENAME"
