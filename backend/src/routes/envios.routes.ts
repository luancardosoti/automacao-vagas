import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { whatsappService } from '../services/whatsapp.service.js'

function montarMensagem(texto: string, nome: string) {
  return texto.replaceAll('[nome]', nome)
}

export const enviosRoutes: FastifyPluginAsync = async (app) => {
  app.get('/envios', async () => {
    return prisma.envio.findMany({
      orderBy: { createdAt: 'desc' },
      include: { template: true, contato: true },
    })
  })

  app.post<{ Body: { templateId: string; contatoId: string } }>('/envios', async (req, reply) => {
    const { templateId, contatoId } = req.body

    const [template, contato] = await Promise.all([
      prisma.template.findUnique({ where: { id: templateId } }),
      prisma.contato.findUnique({ where: { id: contatoId } }),
    ])

    if (!template || !contato) {
      return reply.status(404).send({ error: 'Template ou contato não encontrado' })
    }

    const mensagem = montarMensagem(template.texto, contato.nomeMensagem || contato.nome)

    try {
      await whatsappService.sendMessage(contato.telefone, mensagem)
      const envio = await prisma.envio.create({
        data: { templateId, contatoId, mensagem, status: 'enviado' },
      })
      return reply.status(201).send(envio)
    } catch (err) {
      const erro = err instanceof Error ? err.message : 'Erro desconhecido'
      const envio = await prisma.envio.create({
        data: { templateId, contatoId, mensagem, status: 'falhou', erro },
      })
      return reply.status(502).send(envio)
    }
  })
}
