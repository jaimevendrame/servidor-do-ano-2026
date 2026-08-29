-- AlterTable
ALTER TABLE "eleitores" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ativo',
ADD COLUMN "motivoBloqueio" TEXT,
ADD COLUMN "dataBloqueio" TIMESTAMP(3);
