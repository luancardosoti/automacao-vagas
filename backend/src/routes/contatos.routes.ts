import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma.js'

export const contatosRoutes: FastifyPluginAsync = async (app) => {
  app.get('/contatos', async () => {
    return prisma.contato.findMany({ orderBy: { createdAt: 'desc' } })
  })

  app.post<{ Body: { nome: string; telefone: string; nomeMensagem?: string } }>(
    '/contatos',
    async (req, reply) => {
      const { nome, telefone, nomeMensagem } = req.body
      if (!nome || !telefone) {
        return reply.status(400).send({ error: 'nome e telefone são obrigatórios' })
      }
      const contato = await prisma.contato.create({
        data: { nome, telefone, nomeMensagem: nomeMensagem?.trim() || null },
      })
      return reply.status(201).send(contato)
    },
  )

  app.delete<{ Params: { id: string } }>('/contatos/:id', async (req, reply) => {
    await prisma.contato.delete({ where: { id: req.params.id } })
    return reply.status(204).send()
  })
}
