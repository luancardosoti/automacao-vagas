import { useEffect, useMemo, useState } from 'react'
import { api, type Contato, type Envio, type Template } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function EnviarPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [envios, setEnvios] = useState<Envio[]>([])

  const [templateId, setTemplateId] = useState('')
  const [contatoExistenteId, setContatoExistenteId] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function carregarTudo() {
    const [t, c, e] = await Promise.all([api.templates.list(), api.contatos.list(), api.envios.list()])
    setTemplates(t)
    setContatos(c)
    setEnvios(e)
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  const templateSelecionado = templates.find((t) => t.id === templateId)

  const previaNome = useMemo(() => {
    if (contatoExistenteId) return contatos.find((c) => c.id === contatoExistenteId)?.nome ?? ''
    return novoNome
  }, [contatoExistenteId, novoNome, contatos])

  const previaMensagem = templateSelecionado
    ? templateSelecionado.texto.replaceAll('[nome]', previaNome || '[nome]')
    : ''

  async function enviar() {
    setErro(null)
    setEnviando(true)
    try {
      let contatoId = contatoExistenteId
      if (!contatoId) {
        if (!novoNome || !novoTelefone) {
          throw new Error('Informe nome e telefone do contato, ou selecione um contato existente')
        }
        const novoContato = await api.contatos.create({ nome: novoNome, telefone: novoTelefone })
        contatoId = novoContato.id
      }
      await api.envios.create({ templateId, contatoId })
      setNovoNome('')
      setNovoTelefone('')
      setContatoExistenteId('')
      setTemplateId('')
      await carregarTudo()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Enviar mensagem</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label>Template</Label>
            <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="">Selecione um template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Contato já cadastrado</Label>
            <Select
              value={contatoExistenteId}
              onChange={(e) => setContatoExistenteId(e.target.value)}
            >
              <option value="">-- ou preencha um novo contato abaixo --</option>
              {contatos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.telefone})
                </option>
              ))}
            </Select>
          </div>

          {!contatoExistenteId && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>Nome da pessoa</Label>
                <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: Maria" />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Telefone (com DDI e DDD)</Label>
                <Input
                  value={novoTelefone}
                  onChange={(e) => setNovoTelefone(e.target.value)}
                  placeholder="Ex: 5511999999999"
                />
              </div>
            </div>
          )}

          {previaMensagem && (
            <div className="rounded-md border border-border bg-muted/50 p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Pré-visualização</p>
              <p className="whitespace-pre-wrap text-sm">{previaMensagem}</p>
            </div>
          )}

          {erro && <p className="text-sm text-destructive">{erro}</p>}

          <Button onClick={enviar} disabled={!templateId || enviando}>
            {enviando ? 'Enviando...' : 'Enviar mensagem'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de envios</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {envios.length === 0 && <p className="text-sm text-muted-foreground">Nenhum envio realizado ainda.</p>}
          {envios.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-md border border-border p-2">
              <div>
                <p className="text-sm font-medium">{e.contato.nome}</p>
                <p className="text-xs text-muted-foreground">{e.template.nome}</p>
              </div>
              <Badge variant={e.status === 'enviado' ? 'default' : 'destructive'}>{e.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
