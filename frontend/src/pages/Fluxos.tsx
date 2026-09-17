import { useEffect, useMemo, useState } from 'react'
import {
  api,
  type Contato,
  type Disparo,
  type Documento,
  type EtapaInput,
  type Fluxo,
  type ResultadoEtapaDisparo,
  type Template,
  type TipoEtapa,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ROTULO_TIPO: Record<TipoEtapa, string> = {
  template: 'Template',
  documento: 'Documento',
  texto: 'Mensagem livre',
}

const SEM_CONTATO = '__sem_contato__'

function etapaVazia(): EtapaInput {
  return { tipo: 'texto', texto: '' }
}

export function FluxosPage() {
  const [fluxos, setFluxos] = useState<Fluxo[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [disparos, setDisparos] = useState<Disparo[]>([])

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [etapas, setEtapas] = useState<EtapaInput[]>([etapaVazia()])
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const [fluxoParaDisparar, setFluxoParaDisparar] = useState<string>('')
  const [contatoExistenteId, setContatoExistenteId] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [disparando, setDisparando] = useState(false)
  const [erroDisparo, setErroDisparo] = useState<string | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)

  async function carregarTudo() {
    // busca cada recurso separadamente: se um endpoint falhar (ex: banco sem
    // a migração mais recente), os demais continuam carregando normalmente
    // em vez de deixar a tela inteira vazia por causa de um Promise.all
    const [f, t, d, c, disp] = await Promise.allSettled([
      api.fluxos.list(),
      api.templates.list(),
      api.documentos.list(),
      api.contatos.list(),
      api.disparos.list(),
    ])
    if (f.status === 'fulfilled') setFluxos(f.value)
    if (t.status === 'fulfilled') setTemplates(t.value)
    if (d.status === 'fulfilled') setDocumentos(d.value)
    if (c.status === 'fulfilled') setContatos(c.value)
    if (disp.status === 'fulfilled') setDisparos(disp.value)

    const falhas = [f, t, d, c, disp].filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    )
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

  function limparForm() {
    setEditandoId(null)
    setNome('')
    setEtapas([etapaVazia()])
    setErro(null)
  }

  function editar(fluxo: Fluxo) {
    setEditandoId(fluxo.id)
    setNome(fluxo.nome)
    setEtapas(
      fluxo.etapas.map((e) => ({
        tipo: e.tipo,
        templateId: e.templateId,
        documentoId: e.documentoId,
        texto: e.texto,
      })),
    )
  }

  function adicionarEtapa() {
    setEtapas((prev) => [...prev, etapaVazia()])
  }

  function atualizarEtapa(i: number, patch: Partial<EtapaInput>) {
    setEtapas((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))
  }

  function mudarTipoEtapa(i: number, tipo: TipoEtapa) {
    atualizarEtapa(i, { tipo, templateId: null, documentoId: null, texto: '' })
  }

  function removerEtapa(i: number) {
    setEtapas((prev) => prev.filter((_, idx) => idx !== i))
  }

  function moverEtapa(i: number, direcao: -1 | 1) {
    setEtapas((prev) => {
      const alvo = i + direcao
      if (alvo < 0 || alvo >= prev.length) return prev
      const copia = [...prev]
      ;[copia[i], copia[alvo]] = [copia[alvo], copia[i]]
      return copia
    })
  }

  async function salvar() {
    setErro(null)
    if (!nome.trim()) {
      setErro('Informe um nome para o fluxo')
      return
    }
    setSalvando(true)
    try {
      if (editandoId) {
        await api.fluxos.update(editandoId, { nome, etapas })
      } else {
        await api.fluxos.create({ nome, etapas })
      }
      limparForm()
      await carregarTudo()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar fluxo')
    } finally {
      setSalvando(false)
    }
  }

  async function remover(id: string) {
    await api.fluxos.remove(id)
    if (editandoId === id) limparForm()
    if (fluxoParaDisparar === id) setFluxoParaDisparar('')
    await carregarTudo()
  }

  const previaNome = useMemo(() => {
    if (contatoExistenteId) return contatos.find((c) => c.id === contatoExistenteId)?.nome ?? ''
    return novoNome
  }, [contatoExistenteId, novoNome, contatos])

  async function disparar() {
    setErroDisparo(null)
    if (!fluxoParaDisparar) {
      setErroDisparo('Selecione um fluxo')
      return
    }
    setDisparando(true)
    try {
      let contatoId = contatoExistenteId
      if (!contatoId) {
        if (!novoNome || !novoTelefone) {
          throw new Error('Informe nome e telefone do contato, ou selecione um contato existente')
        }
        const novoContato = await api.contatos.create({ nome: novoNome, telefone: novoTelefone })
        contatoId = novoContato.id
      }
      await api.fluxos.disparar(fluxoParaDisparar, contatoId)
      setNovoNome('')
      setNovoTelefone('')
      setContatoExistenteId('')
      await carregarTudo()
    } catch (e) {
      setErroDisparo(e instanceof Error ? e.message : 'Erro ao disparar fluxo')
    } finally {
      setDisparando(false)
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
            <CardTitle>{editandoId ? 'Editar fluxo' : 'Novo fluxo'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label>Nome do fluxo</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Apresentação + currículo"
              />
            </div>

            <div className="flex flex-col gap-3">
              {etapas.map((etapa, i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Etapa {i + 1}</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => moverEtapa(i, -1)} disabled={i === 0}>
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moverEtapa(i, 1)}
                        disabled={i === etapas.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removerEtapa(i)}
                        disabled={etapas.length === 1}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Select value={etapa.tipo} onValueChange={(v) => mudarTipoEtapa(i, v as TipoEtapa)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="texto">Mensagem livre (sem template)</SelectItem>
                        <SelectItem value="template">Enviar template</SelectItem>
                        <SelectItem value="documento">Enviar documento</SelectItem>
                      </SelectContent>
                    </Select>

                    {etapa.tipo === 'template' && (
                      <Select
                        value={etapa.templateId ?? ''}
                        onValueChange={(v) => atualizarEtapa(i, { templateId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.length === 0 && (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum template cadastrado</p>
                          )}
                          {templates.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {etapa.tipo === 'documento' && (
                      <Select
                        value={etapa.documentoId ?? ''}
                        onValueChange={(v) => atualizarEtapa(i, { documentoId: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um documento" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentos.length === 0 && (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum documento cadastrado</p>
                          )}
                          {documentos.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {etapa.tipo === 'texto' && (
                      <Textarea
                        value={etapa.texto ?? ''}
                        onChange={(e) => atualizarEtapa(i, { texto: e.target.value })}
                        placeholder="Olá [nome], tudo bem?"
                        rows={3}
                      />
                    )}
                  </div>
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={adicionarEtapa}>
                + Adicionar etapa
              </Button>
            </div>

            {erro && <p className="text-sm text-destructive">{erro}</p>}

            <div className="flex gap-2">
              <Button onClick={salvar} disabled={salvando}>
                {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Criar fluxo'}
              </Button>
              {editandoId && (
                <Button variant="outline" onClick={limparForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          {fluxos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum fluxo criado ainda.</p>}
          {fluxos.map((f) => (
            <Card key={f.id}>
              <CardHeader>
                <CardTitle>{f.nome}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ol className="flex flex-col gap-1">
                  {f.etapas.map((e, i) => (
                    <li key={e.id} className="text-sm text-muted-foreground">
                      {i + 1}. <span className="font-medium text-foreground">{ROTULO_TIPO[e.tipo]}</span> —{' '}
                      {e.tipo === 'template' && (e.template?.nome ?? 'template removido')}
                      {e.tipo === 'documento' && (e.documento?.nome ?? 'documento removido')}
                      {e.tipo === 'texto' && e.texto}
                    </li>
                  ))}
                </ol>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => editar(f)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remover(f.id)}>
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Disparar fluxo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label>Fluxo</Label>
              <Select value={fluxoParaDisparar} onValueChange={setFluxoParaDisparar}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fluxo" />
                </SelectTrigger>
                <SelectContent>
                  {fluxos.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome} ({f.etapas.length} etapa{f.etapas.length === 1 ? '' : 's'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label>Contato já cadastrado</Label>
              <Select
                value={contatoExistenteId || SEM_CONTATO}
                onValueChange={(v) => setContatoExistenteId(v === SEM_CONTATO ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- ou preencha um novo contato abaixo --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_CONTATO}>-- ou preencha um novo contato abaixo --</SelectItem>
                  {contatos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} ({c.telefone})
                    </SelectItem>
                  ))}
                </SelectContent>
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

            {previaNome && <p className="text-xs text-muted-foreground">Destinatário: {previaNome}</p>}

            {erroDisparo && <p className="text-sm text-destructive">{erroDisparo}</p>}

            <Button onClick={disparar} disabled={!fluxoParaDisparar || disparando}>
              {disparando ? 'Disparando...' : 'Disparar fluxo'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de disparos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {disparos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum disparo realizado ainda.</p>}
            {disparos.map((d) => {
              const etapasResultado: ResultadoEtapaDisparo[] = JSON.parse(d.detalhes)
              return (
                <div key={d.id} className="rounded-md border border-border p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{d.contato.nome}</p>
                      <p className="text-xs text-muted-foreground">{d.fluxo.nome}</p>
                    </div>
                    <Badge
                      variant={
                        d.status === 'enviado' ? 'default' : d.status === 'parcial' ? 'muted' : 'destructive'
                      }
                    >
                      {d.status}
                    </Badge>
                  </div>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {etapasResultado.map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        {r.status === 'enviado' ? '✓' : '✗'} {ROTULO_TIPO[r.tipo]}: {r.descricao}
                        {r.erro ? ` — ${r.erro}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
