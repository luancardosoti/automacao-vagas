import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma.js'

export const templatesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/templates', async () => {
    return prisma.template.findMany({ orderBy: { createdAt: 'desc' } })
  })

  app.post<{ Body: { nome: string; texto: string } }>('/templates', async (req, reply) => {
    const { nome, texto } = req.body
    if (!nome || !texto) {
      return reply.status(400).send({ error: 'nome e texto são obrigatórios' })
    }
    const template = await prisma.template.create({ data: { nome, texto } })
    return reply.status(201).send(template)
  })

  app.put<{ Params: { id: string }; Body: { nome: string; texto: string } }>(
    '/templates/:id',
    async (req) => {
      const { id } = req.params
      const { nome, texto } = req.body
      return prisma.template.update({ where: { id }, data: { nome, texto } })
    },
  )

  app.delete<{ Params: { id: string } }>('/templates/:id', async (req, reply) => {
    await prisma.template.delete({ where: { id: req.params.id } })
    return reply.status(204).send()
  })
}
