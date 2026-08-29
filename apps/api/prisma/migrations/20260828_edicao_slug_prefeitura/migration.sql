-- Adiciona slug, nomePrefeitura, cidade, descricao à tabela edicoes.
-- Estratégia: adiciona nullable, faz backfill dos registros existentes, depois torna NOT NULL.

-- 1. Colunas opcionais (nullable) — não precisam de backfill obrigatório
ALTER TABLE "edicoes" ADD COLUMN "cidade" TEXT;
ALTER TABLE "edicoes" ADD COLUMN "descricao" TEXT;

-- 2. Colunas obrigatórias — adiciona nullable primeiro
ALTER TABLE "edicoes" ADD COLUMN "slug" TEXT;
ALTER TABLE "edicoes" ADD COLUMN "nomePrefeitura" TEXT;

-- 3. Backfill dos registros existentes
--    slug = "servidordoano" + ano (ex: servidordoano2026); nomePrefeitura genérico
UPDATE "edicoes" SET "slug" = 'servidordoano' || "ano"::text WHERE "slug" IS NULL;
UPDATE "edicoes" SET "nomePrefeitura" = 'Prefeitura Municipal' WHERE "nomePrefeitura" IS NULL;

-- 4. Agora torna NOT NULL
ALTER TABLE "edicoes" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "edicoes" ALTER COLUMN "nomePrefeitura" SET NOT NULL;

-- 5. Índice único no slug
CREATE UNIQUE INDEX "edicoes_slug_key" ON "edicoes"("slug");
