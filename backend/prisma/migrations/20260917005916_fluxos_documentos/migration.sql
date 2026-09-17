-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Fluxo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FluxoEtapa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fluxoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "templateId" TEXT,
    "documentoId" TEXT,
    "texto" TEXT,
    CONSTRAINT "FluxoEtapa_fluxoId_fkey" FOREIGN KEY ("fluxoId") REFERENCES "Fluxo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FluxoEtapa_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FluxoEtapa_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Disparo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fluxoId" TEXT NOT NULL,
    "contatoId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detalhes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Disparo_fluxoId_fkey" FOREIGN KEY ("fluxoId") REFERENCES "Fluxo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Disparo_contatoId_fkey" FOREIGN KEY ("contatoId") REFERENCES "Contato" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
