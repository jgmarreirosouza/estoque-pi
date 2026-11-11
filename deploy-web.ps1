# Publica a versão web no Firebase Hosting.
# Uso (PowerShell, na pasta do projeto):  .\deploy-web.ps1
$ErrorActionPreference = 'Stop'

Write-Host '1/2  Gerando a versão web (pasta dist)...' -ForegroundColor Cyan
npx expo export -p web
if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar a versão web.' }

Write-Host '2/2  Publicando no Firebase Hosting...' -ForegroundColor Cyan
npx firebase-tools deploy --only hosting
if ($LASTEXITCODE -ne 0) { throw 'Falha ao publicar. Rode "npx firebase-tools login" e tente de novo.' }

Write-Host 'Pronto! Site publicado.' -ForegroundColor Green
