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

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
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
}
