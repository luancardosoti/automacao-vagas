import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma.js'
import { whatsappService } from '../services/whatsapp.service.js'
import { lerArquivoDocumento } from './documentos.routes.js'

type TipoEtapa = 'template' | 'documento' | 'texto'

type EtapaInput = {
  tipo: TipoEtapa
  templateId?: string | null
  documentoId?: string | null
  texto?: string | null
}

const include = {
  etapas: { orderBy: { ordem: 'asc' as const }, include: { template: true, documento: true } },
}

function montarMensagem(texto: string, nome: string) {
  return texto.replaceAll('[nome]', nome)
}

function validarEtapas(etapas: EtapaInput[]) {
  if (!Array.isArray(etapas) || etapas.length === 0) {
    return 'O fluxo precisa de pelo menos uma etapa'
  }
  for (const etapa of etapas) {
    if (etapa.tipo === 'template' && !etapa.templateId) return 'Etapa de template sem template selecionado'
    if (etapa.tipo === 'documento' && !etapa.documentoId) return 'Etapa de documento sem documento selecionado'
    if (etapa.tipo === 'texto' && !etapa.texto?.trim()) return 'Etapa de mensagem livre sem texto'
    if (!['template', 'documento', 'texto'].includes(etapa.tipo)) return `Tipo de etapa inválido: ${etapa.tipo}`
  }
  return null
}

export const fluxosRoutes: FastifyPluginAsync = async (app) => {
  app.get('/fluxos', async () => {
    return prisma.fluxo.findMany({ orderBy: { createdAt: 'desc' }, include })
  })

  app.post<{ Body: { nome: string; etapas: EtapaInput[] } }>('/fluxos', async (req, reply) => {
    const { nome, etapas } = req.body
    if (!nome?.trim()) {
      return reply.status(400).send({ error: 'nome é obrigatório' })
    }
    const erro = validarEtapas(etapas)
    if (erro) return reply.status(400).send({ error: erro })

    const fluxo = await prisma.fluxo.create({
      data: {
        nome,
        etapas: {
          create: etapas.map((e, i) => ({
            ordem: i,
            tipo: e.tipo,
            templateId: e.tipo === 'template' ? e.templateId : null,
            documentoId: e.tipo === 'documento' ? e.documentoId : null,
            texto: e.tipo === 'texto' ? e.texto : null,
          })),
        },
      },
      include,
    })
    return reply.status(201).send(fluxo)
  })

  app.put<{ Params: { id: string }; Body: { nome: string; etapas: EtapaInput[] } }>(
    '/fluxos/:id',
    async (req, reply) => {
      const { id } = req.params
      const { nome, etapas } = req.body
      if (!nome?.trim()) {
        return reply.status(400).send({ error: 'nome é obrigatório' })
      }
      const erro = validarEtapas(etapas)
      if (erro) return reply.status(400).send({ error: erro })

      const fluxo = await prisma.$transaction(async (tx) => {
        await tx.fluxoEtapa.deleteMany({ where: { fluxoId: id } })
        return tx.fluxo.update({
          where: { id },
          data: {
            nome,
            etapas: {
              create: etapas.map((e, i) => ({
                ordem: i,
                tipo: e.tipo,
                templateId: e.tipo === 'template' ? e.templateId : null,
                documentoId: e.tipo === 'documento' ? e.documentoId : null,
                texto: e.tipo === 'texto' ? e.texto : null,
              })),
            },
          },
          include,
        })
      })
      return fluxo
    },
  )

  app.delete<{ Params: { id: string } }>('/fluxos/:id', async (req, reply) => {
    await prisma.fluxo.delete({ where: { id: req.params.id } })
    return reply.status(204).send()
  })

  app.get('/disparos', async () => {
    return prisma.disparo.findMany({
      orderBy: { createdAt: 'desc' },
      include: { fluxo: true, contato: true },
    })
  })

  app.post<{ Params: { id: string }; Body: { contatoId: string } }>(
    '/fluxos/:id/disparar',
    async (req, reply) => {
      const { contatoId } = req.body
      const [fluxo, contato] = await Promise.all([
        prisma.fluxo.findUnique({ where: { id: req.params.id }, include }),
        prisma.contato.findUnique({ where: { id: contatoId } }),
      ])
      if (!fluxo || !contato) {
        return reply.status(404).send({ error: 'Fluxo ou contato não encontrado' })
      }

      const resultados: Array<{ ordem: number; tipo: TipoEtapa; descricao: string; status: string; erro?: string }> = []

      for (const etapa of fluxo.etapas) {
        try {
          if (etapa.tipo === 'template' && etapa.template) {
            const mensagem = montarMensagem(etapa.template.texto, contato.nomeMensagem || contato.nome)
            await whatsappService.sendMessage(contato.telefone, mensagem)
            resultados.push({ ordem: etapa.ordem, tipo: 'template', descricao: etapa.template.nome, status: 'enviado' })
          } else if (etapa.tipo === 'documento' && etapa.documento) {
            const arquivo = await lerArquivoDocumento(etapa.documento.nomeArquivo)
            await whatsappService.sendDocument(contato.telefone, arquivo, {
              mimetype: etapa.documento.mimetype,
              fileName: etapa.documento.nomeOriginal,
            })
            resultados.push({ ordem: etapa.ordem, tipo: 'documento', descricao: etapa.documento.nome, status: 'enviado' })
          } else if (etapa.tipo === 'texto' && etapa.texto) {
            const mensagem = montarMensagem(etapa.texto, contato.nomeMensagem || contato.nome)
            await whatsappService.sendMessage(contato.telefone, mensagem)
            resultados.push({ ordem: etapa.ordem, tipo: 'texto', descricao: mensagem.slice(0, 60), status: 'enviado' })
          } else {
            throw new Error('Etapa inválida (referência ausente)')
          }
        } catch (err) {
          const mensagemErro = err instanceof Error ? err.message : 'Erro desconhecido'
          resultados.push({
            ordem: etapa.ordem,
            tipo: etapa.tipo as TipoEtapa,
            descricao: etapa.template?.nome ?? etapa.documento?.nome ?? etapa.texto?.slice(0, 60) ?? '',
            status: 'falhou',
            erro: mensagemErro,
          })
          // uma etapa falhando interrompe o fluxo (ex: whatsapp desconectou no meio)
          break
        }
      }

      const todasEnviadas = resultados.length === fluxo.etapas.length && resultados.every((r) => r.status === 'enviado')
      const nenhumaEnviada = resultados.every((r) => r.status === 'falhou')
      const status = todasEnviadas ? 'enviado' : nenhumaEnviada ? 'falhou' : 'parcial'

      const disparo = await prisma.disparo.create({
        data: {
          fluxoId: fluxo.id,
          contatoId,
          status,
          detalhes: JSON.stringify(resultados),
        },
        include: { fluxo: true, contato: true },
      })

      // sempre 201: o disparo foi registrado, mesmo quando alguma etapa falhou
      // (o campo `status` do disparo já carrega enviado | parcial | falhou)
      return reply.status(201).send(disparo)
    },
  )
}
