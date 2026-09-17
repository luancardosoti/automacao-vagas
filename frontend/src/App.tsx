import { useEffect, useRef, useState } from 'react'
import { TemplatesPage } from '@/pages/Templates'
import { WhatsappStatusPage } from '@/pages/WhatsappStatus'
import { EnviarPage } from '@/pages/Enviar'
import { DocumentosPage } from '@/pages/Documentos'
import { FluxosPage } from '@/pages/Fluxos'
import { EmailsPage } from '@/pages/Emails'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api, type WhatsappStatus } from '@/lib/api'

type Aba = 'enviar' | 'fluxos' | 'emails' | 'documentos' | 'templates' | 'whatsapp'

const INTERVALO_STATUS_MS = 30_000
const MAX_ERROS_CONSECUTIVOS = 3

export default function App() {
  const [aba, setAba] = useState<Aba>('enviar')
  const [status, setStatus] = useState<WhatsappStatus['status']>('desconectado')
  const errosConsecutivos = useRef(0)
  const pollingParado = useRef(false)

  async function consultarStatus() {
    if (pollingParado.current) return
    try {
      const s = await api.whatsapp.status()
      setStatus(s.status)
      errosConsecutivos.current = 0
    } catch {
      errosConsecutivos.current += 1
      // depois de falhar 3x seguidas para de bater na API; só volta a
      // consultar se a pessoa recarregar a página ou abrir a aba de conexão
      if (errosConsecutivos.current >= MAX_ERROS_CONSECUTIVOS) {
        pollingParado.current = true
      }
    }
  }

  useEffect(() => {
    const interval = setInterval(consultarStatus, INTERVALO_STATUS_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (aba === 'whatsapp') {
      errosConsecutivos.current = 0
      pollingParado.current = false
      consultarStatus()
    }
  }, [aba])

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Automação de Vagas</h1>
        <Badge variant={status === 'conectado' ? 'default' : 'muted'}>
          WhatsApp: {status === 'conectado' ? 'conectado' : status === 'aguardando_qr' ? 'aguardando QR' : 'desconectado'}
        </Badge>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        <Button variant={aba === 'enviar' ? 'default' : 'outline'} onClick={() => setAba('enviar')}>
          Enviar
        </Button>
        <Button variant={aba === 'fluxos' ? 'default' : 'outline'} onClick={() => setAba('fluxos')}>
          Fluxos
        </Button>
        <Button variant={aba === 'emails' ? 'default' : 'outline'} onClick={() => setAba('emails')}>
          Emails
        </Button>
        <Button variant={aba === 'documentos' ? 'default' : 'outline'} onClick={() => setAba('documentos')}>
          Documentos
        </Button>
        <Button variant={aba === 'templates' ? 'default' : 'outline'} onClick={() => setAba('templates')}>
          Templates
        </Button>
        <Button variant={aba === 'whatsapp' ? 'default' : 'outline'} onClick={() => setAba('whatsapp')}>
          Conexão WhatsApp
        </Button>
      </nav>

      {aba === 'enviar' && <EnviarPage />}
      {aba === 'fluxos' && <FluxosPage />}
      {aba === 'emails' && <EmailsPage />}
      {aba === 'documentos' && <DocumentosPage />}
      {aba === 'templates' && <TemplatesPage />}
      {aba === 'whatsapp' && <WhatsappStatusPage />}
    </div>
  )
}
