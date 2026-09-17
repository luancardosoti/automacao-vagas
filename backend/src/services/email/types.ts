export interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
}

export interface EmailMessage {
  to: string
  subject: string
  text: string
  attachments?: EmailAttachment[]
}

// Contrato único que todo provedor de e-mail precisa implementar. Trocar de
// provedor (ex: Gmail -> Resend) é criar uma nova classe que implementa essa
// interface e apontar pra ela em email/index.ts — o resto do backend (rotas,
// etc.) nunca importa um provedor específico, só este tipo.
export interface EmailService {
  send(message: EmailMessage): Promise<void>
}
