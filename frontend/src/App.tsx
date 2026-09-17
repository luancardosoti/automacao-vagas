import { useEffect, useState } from 'react'
import { TemplatesPage } from '@/pages/Templates'
import { WhatsappStatusPage } from '@/pages/WhatsappStatus'
import { EnviarPage } from '@/pages/Enviar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api, type WhatsappStatus } from '@/lib/api'

type Aba = 'enviar' | 'templates' | 'whatsapp'

export default function App() {
  const [aba, setAba] = useState<Aba>('enviar')
  const [status, setStatus] = useState<WhatsappStatus['status']>('desconectado')

  useEffect(() => {
    const interval = setInterval(() => {
      api.whatsapp.status().then((s) => setStatus(s.status))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Automação de Vagas</h1>
        <Badge variant={status === 'conectado' ? 'default' : 'muted'}>
          WhatsApp: {status === 'conectado' ? 'conectado' : status === 'aguardando_qr' ? 'aguardando QR' : 'desconectado'}
        </Badge>
      </header>

      <nav className="mb-6 flex gap-2">
        <Button variant={aba === 'enviar' ? 'default' : 'outline'} onClick={() => setAba('enviar')}>
          Enviar
        </Button>
        <Button variant={aba === 'templates' ? 'default' : 'outline'} onClick={() => setAba('templates')}>
          Templates
        </Button>
        <Button variant={aba === 'whatsapp' ? 'default' : 'outline'} onClick={() => setAba('whatsapp')}>
          Conexão WhatsApp
        </Button>
      </nav>

      {aba === 'enviar' && <EnviarPage />}
      {aba === 'templates' && <TemplatesPage />}
      {aba === 'whatsapp' && <WhatsappStatusPage />}
    </div>
  )
}
