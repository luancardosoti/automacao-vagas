import Fastify from 'fastify'
import cors from '@fastify/cors'
import { templatesRoutes } from './routes/templates.routes.js'
import { contatosRoutes } from './routes/contatos.routes.js'
import { enviosRoutes } from './routes/envios.routes.js'
import { whatsappRoutes } from './routes/whatsapp.routes.js'

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })

await app.register(templatesRoutes)
await app.register(contatosRoutes)
await app.register(enviosRoutes)
await app.register(whatsappRoutes)

const port = Number(process.env.PORT ?? 3333)

app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`Servidor rodando em http://localhost:${port}`))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
