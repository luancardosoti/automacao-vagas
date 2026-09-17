import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { getEmailService } from '../services/email/index.js'
import { lerArquivoDocumento } from './documentos.routes.js'

function montarMensagem(texto: string, nomeMensagem?: string) {
  if (!nomeMensagem) return texto
  return texto.replaceAll('[nome]', nomeMensagem)
}

export const emailsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/emails', async () => {
    return prisma.envioEmail.findMany({
      orderBy: { createdAt: 'desc' },
      include: { template: true, documento: true },
    })
  })

  app.post<{
    Body: {
      nome: string
      nomeMensagem?: string
      destinatario: string
      assunto: string
      templateId: string
      documentoId?: string
    }
  }>('/emails', async (req, reply) => {
    const { nome, nomeMensagem, destinatario, assunto, templateId, documentoId } = req.body

    if (!nome?.trim() || !destinatario?.trim() || !assunto?.trim() || !templateId) {
      return reply.status(400).send({ error: 'nome, destinatario, assunto e templateId são obrigatórios' })
    }

    const [template, documento] = await Promise.all([
      prisma.template.findUnique({ where: { id: templateId } }),
      documentoId ? prisma.documento.findUnique({ where: { id: documentoId } }) : Promise.resolve(null),
    ])

    if (!template) {
      return reply.status(404).send({ error: 'Template não encontrado' })
    }
    if (documentoId && !documento) {
      return reply.status(404).send({ error: 'Documento não encontrado' })
    }

    const mensagem = montarMensagem(template.texto, nomeMensagem)

    try {
      const attachments = documento
        ? [
            {
              filename: documento.nomeOriginal,
              content: await lerArquivoDocumento(documento.nomeArquivo),
              contentType: documento.mimetype,
            },
          ]
        : undefined

      await getEmailService().send({ to: destinatario, subject: assunto, text: mensagem, attachments })

      const envio = await prisma.envioEmail.create({
        data: {
          nome,
          nomeMensagem: nomeMensagem?.trim() || null,
          destinatario,
          assunto,
          mensagem,
          templateId,
          documentoId: documentoId || null,
          status: 'enviado',
        },
        include: { template: true, documento: true },
      })
      return reply.status(201).send(envio)
    } catch (err) {
      const erro = err instanceof Error ? err.message : 'Erro desconhecido'
      const envio = await prisma.envioEmail.create({
        data: {
          nome,
          nomeMensagem: nomeMensagem?.trim() || null,
          destinatario,
          assunto,
          mensagem,
          templateId,
          documentoId: documentoId || null,
          status: 'falhou',
          erro,
        },
        include: { template: true, documento: true },
      })
      return reply.status(201).send(envio)
    }
  })
}
