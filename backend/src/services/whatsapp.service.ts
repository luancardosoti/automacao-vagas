/**
 * Camada fina sobre o zapo-js (pacote npm "zapo-js").
 *
 * IMPORTANTE: zapo-js está em desenvolvimento ativo e a API pode mudar entre
 * versões menores. Os nomes de eventos e métodos abaixo (auth_qr, auth_paired,
 * disconnected, client.message.send) seguem o quick start da documentação
 * oficial em https://zapo.to — confira lá antes de subir em produção, e ajuste
 * aqui caso a versão instalada tenha renomeado algo.
 */
import { WaClient, ConsoleLogger, createStore } from 'zapo-js'
import { createSqliteStore } from '@zapo-js/store-sqlite'
import QRCode from 'qrcode'

export type WhatsappStatus = 'desconectado' | 'aguardando_qr' | 'conectado'

class WhatsappService {
  private client: WaClient | null = null
  private status: WhatsappStatus = 'desconectado'
  private qrCodeDataUrl: string | null = null

  getStatus() {
    return { status: this.status, qrCode: this.qrCodeDataUrl }
  }

  async connect() {
    if (this.client) return this.getStatus()

    const store = createStore({
      backends: {
        sqlite: createSqliteStore({ path: '.auth/state.sqlite' }),
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

    this.client.on('auth_qr', async ({ qr }: { qr: string }) => {
      this.status = 'aguardando_qr'
      this.qrCodeDataUrl = await QRCode.toDataURL(qr)
    })

    this.client.on('auth_paired', () => {
      this.status = 'conectado'
      this.qrCodeDataUrl = null
    })

    this.client.on('disconnected', () => {
      this.status = 'desconectado'
      this.qrCodeDataUrl = null
      this.client = null
    })

    await this.client.connect()
    return this.getStatus()
  }

  async sendMessage(telefone: string, mensagem: string) {
    if (!this.client || this.status !== 'conectado') {
      throw new Error('WhatsApp não está conectado. Conecte antes de enviar mensagens.')
    }
    const digitos = telefone.replace(/\D/g, '')
    const remoteJid = `${digitos}@s.whatsapp.net`
    await this.client.message.send(remoteJid, mensagem)
  }
}

export const whatsappService = new WhatsappService()
