// Roda automaticamente depois de `npm install` na raiz (postinstall):
// garante o backend/.env e aplica as migrations do Prisma, pra um único
// `npm install` deixar o projeto pronto pra `npm run dev`.
import { existsSync, copyFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const backendDir = fileURLToPath(new URL('../backend', import.meta.url))
const envPath = `${backendDir}/.env`
const envExamplePath = `${backendDir}/.env.example`

if (!existsSync(envPath) && existsSync(envExamplePath)) {
  copyFileSync(envExamplePath, envPath)
  console.log('[setup] backend/.env criado a partir de backend/.env.example')
}

execSync('npx prisma generate', { cwd: backendDir, stdio: 'inherit' })
execSync('npx prisma migrate deploy', { cwd: backendDir, stdio: 'inherit' })
