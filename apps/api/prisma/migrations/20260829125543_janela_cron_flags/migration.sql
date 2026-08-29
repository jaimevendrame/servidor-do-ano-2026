-- AlterTable
ALTER TABLE "janelas_votacao" ADD COLUMN "aberturaAutoRegistrada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "fechamentoAutoRegistrado" BOOLEAN NOT NULL DEFAULT false;
