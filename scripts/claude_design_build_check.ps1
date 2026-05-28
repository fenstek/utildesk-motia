param(
  [int]$Port = 0
)

$ErrorActionPreference = "Stop"

Write-Host "== Utildesk Claude design compact check =="
Write-Host "Branch:" (git branch --show-current)
Write-Host "HEAD:" (git log -1 --oneline)

Write-Host "`n== Tool quality guard =="
npm run check:tool-quality

Write-Host "`n== Astro build =="
npm --prefix site run build

if ($Port -gt 0) {
  Write-Host "`n== HTTP smoke against http://127.0.0.1:$Port =="
  $urls = @(
    "http://127.0.0.1:$Port/",
    "http://127.0.0.1:$Port/tools/",
    "http://127.0.0.1:$Port/tools/zapier/",
    "http://127.0.0.1:$Port/ratgeber/",
    "http://127.0.0.1:$Port/methodologie/",
    "http://127.0.0.1:$Port/impressum/",
    "http://127.0.0.1:$Port/datenschutz/"
  )
  foreach ($url in $urls) {
    $code = curl.exe -s -o NUL -w "%{http_code}" $url
    Write-Host "$url -> $code"
    if ($code -ne "200") { throw "Non-200 response for ${url}: $code" }
  }
} else {
  Write-Host "`nHTTP smoke skipped. Start dev/preview server and rerun with -Port <port> if needed."
}

