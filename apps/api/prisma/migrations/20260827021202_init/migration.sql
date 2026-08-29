-- CreateTable
CREATE TABLE "edicoes" (
    "id" SERIAL NOT NULL,
    "ano" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setores" (
    "id" SERIAL NOT NULL,
    "edicaoId" INTEGER NOT NULL,
    "nomeOficial" TEXT NOT NULL,
    "nomeExibido" TEXT NOT NULL,
    "agrupado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "setores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eleitores" (
    "id" SERIAL NOT NULL,
    "edicaoId" INTEGER NOT NULL,
    "setorId" INTEGER NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataAdmissao" DATE NOT NULL,
    "cargo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eleitores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidatos" (
    "id" SERIAL NOT NULL,
    "edicaoId" INTEGER NOT NULL,
    "setorId" INTEGER NOT NULL,
    "eleitorId" INTEGER,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "ordemExibicao" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participacoes" (
    "id" SERIAL NOT NULL,
    "eleitorId" INTEGER NOT NULL,
    "edicaoId" INTEGER NOT NULL,
    "registradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votos" (
    "id" SERIAL NOT NULL,
    "candidatoId" INTEGER NOT NULL,
    "setorId" INTEGER NOT NULL,
    "edicaoId" INTEGER NOT NULL,
    "registradoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "votos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "janelas_votacao" (
    "id" SERIAL NOT NULL,
    "edicaoId" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "abertaManual" BOOLEAN NOT NULL DEFAULT false,
    "fechadaManual" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "janelas_votacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "totpSecret" TEXT,
    "totpHabilitado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" SERIAL NOT NULL,
    "ator" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "payload" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "edicoes_ano_key" ON "edicoes"("ano");

-- CreateIndex
CREATE UNIQUE INDEX "setores_edicaoId_nomeOficial_key" ON "setores"("edicaoId", "nomeOficial");

-- CreateIndex
CREATE UNIQUE INDEX "eleitores_edicaoId_cpf_key" ON "eleitores"("edicaoId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "candidatos_edicaoId_eleitorId_key" ON "candidatos"("edicaoId", "eleitorId");

-- CreateIndex
CREATE UNIQUE INDEX "participacoes_eleitorId_edicaoId_key" ON "participacoes"("eleitorId", "edicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "janelas_votacao_edicaoId_key" ON "janelas_votacao"("edicaoId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE INDEX "logs_auditoria_ator_idx" ON "logs_auditoria"("ator");

-- CreateIndex
CREATE INDEX "logs_auditoria_acao_idx" ON "logs_auditoria"("acao");

-- CreateIndex
CREATE INDEX "logs_auditoria_timestamp_idx" ON "logs_auditoria"("timestamp");

-- AddForeignKey
ALTER TABLE "setores" ADD CONSTRAINT "setores_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleitores" ADD CONSTRAINT "eleitores_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleitores" ADD CONSTRAINT "eleitores_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatos" ADD CONSTRAINT "candidatos_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacoes" ADD CONSTRAINT "participacoes_eleitorId_fkey" FOREIGN KEY ("eleitorId") REFERENCES "eleitores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacoes" ADD CONSTRAINT "participacoes_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos" ADD CONSTRAINT "votos_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "candidatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos" ADD CONSTRAINT "votos_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos" ADD CONSTRAINT "votos_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "janelas_votacao" ADD CONSTRAINT "janelas_votacao_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "edicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
