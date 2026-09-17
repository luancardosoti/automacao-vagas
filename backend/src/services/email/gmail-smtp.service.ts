import nodemailer, { type Transporter } from 'nodemailer'
import type { EmailMessage, EmailService } from './types.js'

// Envia via SMTP do Gmail usando uma "senha de app" (não a senha normal da
// conta). Veja EMAIL_SETUP.md na raiz do repo para o passo a passo de gerar
// essa senha e configurar as variáveis de ambiente.
export class GmailSmtpEmailService implements EmailService {
  private transporter: Transporter

  constructor(private readonly usuario: string, senhaApp: string, private readonly nomeExibicao?: string) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: usuario, pass: senhaApp },
    })
  }

  async send(message: EmailMessage) {
    await this.transporter.sendMail({
      from: this.nomeExibicao ? `"${this.nomeExibicao}" <${this.usuario}>` : this.usuario,
      to: message.to,
      subject: message.subject,
      text: message.text,
      attachments: message.attachments,
    })
  }
}
