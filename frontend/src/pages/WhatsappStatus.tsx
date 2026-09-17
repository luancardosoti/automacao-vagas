import { useEffect, useState } from 'react'
import { api, type WhatsappStatus } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const LABELS: Record<WhatsappStatus['status'], string> = {
  desconectado: 'Desconectado',
  aguardando_qr: 'Aguardando leitura do QR Code',
  conectado: 'Conectado',
}

export function WhatsappStatusPage() {
  const [status, setStatus] = useState<WhatsappStatus>({ status: 'desconectado', qrCode: null })
  const [conectando, setConectando] = useState(false)

  async function atualizar() {
    setStatus(await api.whatsapp.status())
  }

  useEffect(() => {
    atualizar()
    const interval = setInterval(atualizar, 3000)
    return () => clearInterval(interval)
  }, [])

  async function conectar() {
    setConectando(true)
    try {
      await api.whatsapp.connect()
      await atualizar()
    } finally {
      setConectando(false)
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Conexão com o WhatsApp</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <Badge variant={status.status === 'conectado' ? 'default' : 'muted'}>{LABELS[status.status]}</Badge>

        {status.status === 'aguardando_qr' && status.qrCode && (
          <img src={status.qrCode} alt="QR Code do WhatsApp" className="h-56 w-56 rounded-md border border-border" />
        )}

        {status.status === 'desconectado' && (
          <Button onClick={conectar} disabled={conectando}>
            {conectando ? 'Conectando...' : 'Conectar WhatsApp'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
