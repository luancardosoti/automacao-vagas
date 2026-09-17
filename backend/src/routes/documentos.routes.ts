import type { FastifyPluginAsync } from 'fastify'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { prisma } from '../lib/prisma.js'

export const UPLOADS_DIR = join(process.cwd(), 'uploads')

async function salvarArquivo(nomeOriginal: string, buffer: Buffer) {
  await mkdir(UPLOADS_DIR, { recursive: true })
  const nomeArquivo = `${randomUUID()}${extname(nomeOriginal)}`
  await writeFile(join(UPLOADS_DIR, nomeArquivo), buffer)
  return nomeArquivo
}

export async function lerArquivoDocumento(nomeArquivo: string) {
  return readFile(join(UPLOADS_DIR, nomeArquivo))
}

export const documentosRoutes: FastifyPluginAsync = async (app) => {
  app.get('/documentos', async () => {
    return prisma.documento.findMany({ orderBy: { createdAt: 'desc' } })
  })

  app.post('/documentos', async (req, reply) => {
    const parte = await req.file()
    if (!parte) {
      return reply.status(400).send({ error: 'Nenhum arquivo enviado' })
    }

    const nomeCampo = (parte.fields.nome as { value?: string } | undefined)?.value
    const nome = nomeCampo?.trim() || parte.filename

    const buffer = await parte.toBuffer()
    const nomeArquivo = await salvarArquivo(parte.filename, buffer)

    const documento = await prisma.documento.create({
      data: {
        nome,
        nomeArquivo,
        nomeOriginal: parte.filename,
        mimetype: parte.mimetype,
        tamanho: buffer.byteLength,
      },
    })
    return reply.status(201).send(documento)
  })

  app.delete<{ Params: { id: string } }>('/documentos/:id', async (req, reply) => {
    const documento = await prisma.documento.findUnique({ where: { id: req.params.id } })
    if (!documento) {
      return reply.status(404).send({ error: 'Documento não encontrado' })
    }
    await prisma.documento.delete({ where: { id: req.params.id } })
    await rm(join(UPLOADS_DIR, documento.nomeArquivo), { force: true })
    return reply.status(204).send()
  })
}
