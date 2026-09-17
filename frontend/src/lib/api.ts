export type Template = {
  id: string
  nome: string
  texto: string
  createdAt: string
}

export type Contato = {
  id: string
  nome: string
  telefone: string
  createdAt: string
}

export type Envio = {
  id: string
  templateId: string
  contatoId: string
  mensagem: string
  status: 'enviado' | 'falhou'
  erro?: string | null
  createdAt: string
  template: Template
  contato: Contato
}

export type WhatsappStatus = {
  status: 'desconectado' | 'aguardando_qr' | 'conectado'
  qrCode: string | null
}

export type Documento = {
  id: string
  nome: string
  nomeArquivo: string
  nomeOriginal: string
  mimetype: string
  tamanho: number
  createdAt: string
}

export type TipoEtapa = 'template' | 'documento' | 'texto'

export type FluxoEtapa = {
  id: string
  fluxoId: string
  ordem: number
  tipo: TipoEtapa
  templateId: string | null
  documentoId: string | null
  texto: string | null
  template: Template | null
  documento: Documento | null
}

export type Fluxo = {
  id: string
  nome: string
  createdAt: string
  updatedAt: string
  etapas: FluxoEtapa[]
}

export type EtapaInput = {
  tipo: TipoEtapa
  templateId?: string | null
  documentoId?: string | null
  texto?: string | null
}

export type ResultadoEtapaDisparo = {
  ordem: number
  tipo: TipoEtapa
  descricao: string
  status: 'enviado' | 'falhou'
  erro?: string
}

export type Disparo = {
  id: string
  fluxoId: string
  contatoId: string
  status: 'enviado' | 'parcial' | 'falhou'
  detalhes: string
  createdAt: string
  fluxo: Fluxo
  contato: Contato
}

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: options?.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || body.erro || `Erro ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  templates: {
    list: () => request<Template[]>('/templates'),
    create: (data: { nome: string; texto: string }) =>
      request<Template>('/templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { nome: string; texto: string }) =>
      request<Template>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/templates/${id}`, { method: 'DELETE' }),
  },
  contatos: {
    list: () => request<Contato[]>('/contatos'),
    create: (data: { nome: string; telefone: string }) =>
      request<Contato>('/contatos', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/contatos/${id}`, { method: 'DELETE' }),
  },
  envios: {
    list: () => request<Envio[]>('/envios'),
    create: (data: { templateId: string; contatoId: string }) =>
      request<Envio>('/envios', { method: 'POST', body: JSON.stringify(data) }),
  },
  whatsapp: {
    status: () => request<WhatsappStatus>('/whatsapp/status'),
    connect: () => request<WhatsappStatus>('/whatsapp/connect', { method: 'POST' }),
  },
  documentos: {
    list: () => request<Documento[]>('/documentos'),
    upload: (nome: string, arquivo: File) => {
      const form = new FormData()
      form.append('nome', nome)
      form.append('arquivo', arquivo)
      return request<Documento>('/documentos', { method: 'POST', body: form })
    },
    remove: (id: string) => request<void>(`/documentos/${id}`, { method: 'DELETE' }),
  },
  fluxos: {
    list: () => request<Fluxo[]>('/fluxos'),
    create: (data: { nome: string; etapas: EtapaInput[] }) =>
      request<Fluxo>('/fluxos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { nome: string; etapas: EtapaInput[] }) =>
      request<Fluxo>(`/fluxos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/fluxos/${id}`, { method: 'DELETE' }),
    disparar: (id: string, contatoId: string) =>
      request<Disparo>(`/fluxos/${id}/disparar`, { method: 'POST', body: JSON.stringify({ contatoId }) }),
  },
  disparos: {
    list: () => request<Disparo[]>('/disparos'),
  },
}
