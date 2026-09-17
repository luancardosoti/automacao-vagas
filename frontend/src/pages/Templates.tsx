import { useEffect, useState } from 'react'
import { api, type Template } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [nome, setNome] = useState('')
  const [texto, setTexto] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    setTemplates(await api.templates.list())
  }

  useEffect(() => {
    carregar()
  }, [])

  function limparForm() {
    setNome('')
    setTexto('')
    setEditandoId(null)
  }

  async function salvar() {
    setErro(null)
    try {
      if (editandoId) {
        await api.templates.update(editandoId, { nome, texto })
      } else {
        await api.templates.create({ nome, texto })
      }
      limparForm()
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar')
    }
  }

  function editar(t: Template) {
    setEditandoId(t.id)
    setNome(t.nome)
    setTexto(t.texto)
  }

  async function remover(id: string) {
    await api.templates.remove(id)
    if (editandoId === id) limparForm()
    await carregar()
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{editandoId ? 'Editar template' : 'Novo template'}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="nome">Nome do template</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Vaga - primeiro contato" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="texto">Mensagem (use [nome] onde o nome deve entrar)</Label>
            <Textarea
              id="texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Olá [nome], vi sua vaga e gostaria de me candidatar..."
              rows={6}
            />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <div className="flex gap-2">
            <Button onClick={salvar} disabled={!nome || !texto}>
              {editandoId ? 'Salvar alterações' : 'Criar template'}
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
        {templates.length === 0 && <p className="text-sm text-muted-foreground">Nenhum template criado ainda.</p>}
        {templates.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle>{t.nome}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{t.texto}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => editar(t)}>
                  Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => remover(t.id)}>
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
