import type { FastifyPluginAsync } from 'fastify'
import { whatsappService } from '../services/whatsapp.service.js'

export const whatsappRoutes: FastifyPluginAsync = async (app) => {
  app.get('/whatsapp/status', async () => {
    return whatsappService.getStatus()
  })

  app.post('/whatsapp/connect', async () => {
    return whatsappService.connect()
  })
}
