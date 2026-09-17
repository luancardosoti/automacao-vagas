/**
 * Camada fina sobre o zapo-js (pacote npm "zapo-js").
 *
 * IMPORTANTE: zapo-js está em desenvolvimento ativo e a API pode mudar entre
 * versões menores. Os nomes de eventos e métodos abaixo (auth_qr, connection,
 * client.message.send) seguem a documentação oficial em https://zapo.to —
 * confira lá antes de subir em produção, e ajuste aqui caso a versão
 * instalada tenha renomeado algo.
 *
 * O evento `auth_paired` só dispara no primeiro pareamento via QR; numa
 * reconexão que reaproveita a sessão salva (resume) ele nunca é emitido de
 * novo. Por isso usamos `connection` (status 'open'/'close') para status
 * conectado/desconectado — ele cobre os dois casos.
 */
import { WaClient, ConsoleLogger, createStore } from 'zapo-js'
import { createSqliteStore } from '@zapo-js/store-sqlite'
import QRCode from 'qrcode'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export type WhatsappStatus = 'desconectado' | 'aguardando_qr' | 'conectado'

const AUTH_DB_PATH = '.auth/state.sqlite'

class WhatsappService {
  private client: WaClient | null = null
  private status: WhatsappStatus = 'desconectado'
  private qrCodeDataUrl: string | null = null

  getStatus() {
    return { status: this.status, qrCode: this.qrCodeDataUrl }
  }

  async connect() {
    if (this.client) return this.getStatus()

    mkdirSync(dirname(AUTH_DB_PATH), { recursive: true })

    const store = createStore({
      backends: {
        sqlite: createSqliteStore({ path: AUTH_DB_PATH }),
      },
      providers: {
        auth: 'sqlite',
        signal: 'sqlite',
        preKey: 'sqlite',
        session: 'sqlite',
        identity: 'sqlite',
        senderKey: 'sqlite',
        appState: 'sqlite',
        privacyToken: 'sqlite',
        messages: 'none',
        threads: 'none',
        contacts: 'none',
      },
    })

    this.client = new WaClient(
      { store, sessionId: 'default' },
      new ConsoleLogger('info'),
    )

    this.client.on('auth_qr', async ({ qr }) => {
      this.status = 'aguardando_qr'
      this.qrCodeDataUrl = await QRCode.toDataURL(qr)
    })

    this.client.on('connection', (event) => {
      if (event.status === 'open') {
        this.status = 'conectado'
        this.qrCodeDataUrl = null
      } else {
        this.status = 'desconectado'
        this.qrCodeDataUrl = null
        // o client do zapo-js não reconecta sozinho depois de um close —
        // descarta a instância pra que o próximo connect() (botão
        // "Conectar" na tela) crie um client novo e tente de novo
        this.client = null
      }
    })

    await this.client.connect()
    return this.getStatus()
  }

  async sendMessage(telefone: string, mensagem: string) {
    if (!this.client || this.status !== 'conectado') {
      throw new Error('WhatsApp não está conectado. Conecte antes de enviar mensagens.')
    }
    const remoteJid = this.paraRemoteJid(telefone)
    await this.client.message.send(remoteJid, mensagem)
  }

  async sendDocument(
    telefone: string,
    arquivo: Buffer,
    opcoes: { mimetype: string; fileName: string; caption?: string },
  ) {
    if (!this.client || this.status !== 'conectado') {
      throw new Error('WhatsApp não está conectado. Conecte antes de enviar mensagens.')
    }
    const remoteJid = this.paraRemoteJid(telefone)
    await this.client.message.send(remoteJid, {
      type: 'document',
      media: arquivo,
      mimetype: opcoes.mimetype,
      fileName: opcoes.fileName,
      caption: opcoes.caption,
    })
  }

  private paraRemoteJid(telefone: string) {
    const digitos = telefone.replace(/\D/g, '')
    return `${digitos}@s.whatsapp.net`
  }
}

export const whatsappService = new WhatsappService()
