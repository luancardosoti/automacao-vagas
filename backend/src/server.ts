import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { templatesRoutes } from './routes/templates.routes.js'
import { contatosRoutes } from './routes/contatos.routes.js'
import { enviosRoutes } from './routes/envios.routes.js'
import { whatsappRoutes } from './routes/whatsapp.routes.js'
import { documentosRoutes } from './routes/documentos.routes.js'
import { fluxosRoutes } from './routes/fluxos.routes.js'

const app = Fastify({ logger: true })

app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  if (body === '') {
    done(null, undefined)
    return
  }

  try {
    done(null, JSON.parse(body as string))
  } catch (err) {
    const parsingError = err as Error & { statusCode?: number }
    parsingError.statusCode = 400
    done(parsingError, undefined)
  }
})

await app.register(cors, { origin: true })
await app.register(multipart, { limits: { fileSize: 25 * 1024 * 1024 } })

await app.register(templatesRoutes)
await app.register(contatosRoutes)
await app.register(enviosRoutes)
await app.register(whatsappRoutes)
await app.register(documentosRoutes)
await app.register(fluxosRoutes)

const port = Number(process.env.PORT ?? 3333)

app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`Servidor rodando em http://localhost:${port}`))
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
