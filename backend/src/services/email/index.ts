import { GmailSmtpEmailService } from './gmail-smtp.service.js'
import type { EmailService } from './types.js'

export type { EmailService, EmailMessage, EmailAttachment } from './types.js'

// Único lugar do backend que decide qual provedor de e-mail usar. Pra trocar
// de provedor no futuro (ex: Resend): crie um arquivo novo em services/email/
// implementando EmailService (siga gmail-smtp.service.ts de exemplo), adicione
// um case abaixo, e aponte EMAIL_PROVIDER pra ele no .env — nenhuma rota
// precisa mudar, todas dependem só da interface EmailService.
function criarEmailService(): EmailService {
  const provider = process.env.EMAIL_PROVIDER ?? 'gmail'

  switch (provider) {
    case 'gmail': {
      const usuario = process.env.GMAIL_USER
      const senhaApp = process.env.GMAIL_APP_PASSWORD
      if (!usuario || !senhaApp) {
        throw new Error(
          'GMAIL_USER e GMAIL_APP_PASSWORD precisam estar configurados no .env — veja EMAIL_SETUP.md',
        )
      }
      return new GmailSmtpEmailService(usuario, senhaApp, process.env.EMAIL_FROM_NAME)
    }
    default:
      throw new Error(`Provedor de e-mail desconhecido: "${provider}"`)
  }
}

let instancia: EmailService | null = null

// Lazy: só valida as variáveis de ambiente (e derruba com erro claro) quando
// o primeiro e-mail realmente precisa ser enviado, não na subida do servidor.
export function getEmailService(): EmailService {
  if (!instancia) instancia = criarEmailService()
  return instancia
}
