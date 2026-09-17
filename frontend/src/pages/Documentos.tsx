import { useEffect, useRef, useState } from 'react'
import { api, type Documento } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatarTamanho(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [nome, setNome] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function carregar() {
    setDocumentos(await api.documentos.list())
  }

  useEffect(() => {
    carregar()
  }, [])

  function onEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setArquivo(file)
    if (file && !nome) setNome(file.name.replace(/\.[^.]+$/, ''))
  }

  async function enviar() {
    if (!arquivo) return
    setErro(null)
    setEnviando(true)
    try {
      await api.documentos.upload(nome || arquivo.name, arquivo)
      setNome('')
      setArquivo(null)
      if (inputRef.current) inputRef.current.value = ''
      await carregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao enviar documento')
    } finally {
      setEnviando(false)
    }
  }

  async function remover(id: string) {
    await api.documentos.remove(id)
    await carregar()
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Novo documento</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="arquivo">Arquivo (PDF, imagem, etc.)</Label>
            <Input id="arquivo" ref={inputRef} type="file" onChange={onEscolherArquivo} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="nomeDoc">Nome de exibição</Label>
            <Input
              id="nomeDoc"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Currículo - Luan"
            />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button onClick={enviar} disabled={!arquivo || enviando}>
            {enviando ? 'Enviando...' : 'Adicionar documento'}
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {documentos.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum documento cadastrado ainda.</p>
        )}
        {documentos.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{d.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {d.nomeOriginal} · {formatarTamanho(d.tamanho)}
                </p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => remover(d.id)}>
                Excluir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
