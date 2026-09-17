import { useEffect, useMemo, useState } from 'react'
import { api, type Documento, type EnvioEmail, type Template } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SEM_ANEXO = '__sem_anexo__'

export function EmailsPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [emails, setEmails] = useState<EnvioEmail[]>([])
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [nomeMensagem, setNomeMensagem] = useState('')
  const [destinatario, setDestinatario] = useState('')
  const [assunto, setAssunto] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [documentoId, setDocumentoId] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function carregarTudo() {
    const [t, d, e] = await Promise.allSettled([api.templates.list(), api.documentos.list(), api.emails.list()])
    if (t.status === 'fulfilled') setTemplates(t.value)
    if (d.status === 'fulfilled') setDocumentos(d.value)
    if (e.status === 'fulfilled') setEmails(e.value)

    const falhas = [t, d, e].filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    setErroCarregamento(
      falhas.length === 0
        ? null
        : `Não foi possível carregar: ${falhas
            .map((r) => (r.reason instanceof Error ? r.reason.message : 'erro desconhecido'))
            .join('; ')}`,
    )
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  const templateSelecionado = templates.find((t) => t.id === templateId)
  const previaMensagem = templateSelecionado
    ? templateSelecionado.texto.replaceAll('[nome]', nomeMensagem || '[nome]')
    : ''

  const documentoSelecionado = useMemo(
    () => documentos.find((d) => d.id === documentoId),
    [documentoId, documentos],
  )

  function limparForm() {
    setNome('')
    setNomeMensagem('')
    setDestinatario('')
    setAssunto('')
    setTemplateId('')
    setDocumentoId('')
  }

  async function enviar() {
    setErro(null)
    setEnviando(true)
    try {
      if (!nome || !destinatario || !assunto || !templateId) {
        throw new Error('Preencha nome, destinatário, assunto e template')
      }
      await api.emails.create({
        nome,
        nomeMensagem: nomeMensagem || undefined,
        destinatario,
        assunto,
        templateId,
        documentoId: documentoId || undefined,
      })
      limparForm()
      await carregarTudo()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar e-mail')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {erroCarregamento && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {erroCarregamento}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Enviar e-mail de candidatura</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>Nome (pra você identificar)</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Vaga frontend empresa X" />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Nome na mensagem (opcional)</Label>
                <Input
                  value={nomeMensagem}
                  onChange={(e) => setNomeMensagem(e.target.value)}
                  placeholder="Ex: Recrutador"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label>E-mail do destinatário</Label>
              <Input
                type="email"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                placeholder="Ex: rh@empresa.com"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Assunto</Label>
              <Input
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Ex: Candidatura - Desenvolvedor Frontend"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label>Anexar currículo (opcional)</Label>
              <Select
                value={documentoId || SEM_ANEXO}
                onValueChange={(v) => setDocumentoId(v === SEM_ANEXO ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum documento anexado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_ANEXO}>Nenhum documento anexado</SelectItem>
                  {documentos.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {documentos.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum documento cadastrado ainda — suba um na aba Documentos.
                </p>
              )}
            </div>

            {previaMensagem && (
              <div className="rounded-md border border-border bg-muted/50 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Pré-visualização</p>
                <p className="whitespace-pre-wrap text-sm">{previaMensagem}</p>
                {documentoSelecionado && (
                  <p className="mt-2 text-xs text-muted-foreground">📎 {documentoSelecionado.nomeOriginal}</p>
                )}
              </div>
            )}

            {erro && <p className="text-sm text-destructive">{erro}</p>}

            <Button onClick={enviar} disabled={!templateId || enviando}>
              {enviando ? 'Enviando...' : 'Enviar e-mail'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de e-mails</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {emails.length === 0 && <p className="text-sm text-muted-foreground">Nenhum e-mail enviado ainda.</p>}
            {emails.map((e) => (
              <div key={e.id} className="rounded-md border border-border p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.destinatario} · {e.template.nome}
                      {e.documento ? ` · 📎 ${e.documento.nomeOriginal}` : ''}
                    </p>
                  </div>
                  <Badge variant={e.status === 'enviado' ? 'default' : 'destructive'}>{e.status}</Badge>
                </div>
                {e.erro && <p className="mt-1 text-xs text-destructive">{e.erro}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
