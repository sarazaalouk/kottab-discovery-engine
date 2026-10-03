# Simple test: send one message to Claude and print the reply.
# Reads ANTHROPIC_API_KEY from the .env file next to this script.

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# --- Read the key from .env ---
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Error ".env file not found at $envPath"
}

$apiKey = $null
foreach ($line in Get-Content $envPath -Encoding UTF8) {
    if ($line -match '^\s*ANTHROPIC_API_KEY\s*=\s*(.+?)\s*$') {
        $apiKey = $Matches[1].Trim('"', "'")
    }
}

if (-not $apiKey -or $apiKey -eq "PUT_KEY_HERE") {
    Write-Error "Put your real key in .env (ANTHROPIC_API_KEY=...) first."
}

# --- Build the request ---
$body = @{
    model      = "claude-sonnet-5-5"
    max_tokens = 2048
    fallbacks  = "default"
    messages   = @(
        @{
            role    = "user"
            content = "ما الجذر الثلاثي لكلمة الرحمن؟ جاوب بكلمة واحدة"
        }
    )
} | ConvertTo-Json -Depth 5

$headers = @{
    "x-api-key"         = $apiKey
    "anthropic-version" = "2023-06-01"
    "anthropic-beta"    = "server-side-fallback-2026-07-01"
}

# --- Send it (body as UTF-8 bytes so the Arabic text arrives intact) ---
try {
    $response = Invoke-WebRequest -Uri "https://api.anthropic.com/v1/messages" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json; charset=utf-8" `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) `
        -UseBasicParsing
}
catch {
    $errResponse = $_.Exception.Response
    if ($errResponse) {
        $reader = New-Object System.IO.StreamReader($errResponse.GetResponseStream(), [System.Text.Encoding]::UTF8)
        Write-Host "API error ($([int]$errResponse.StatusCode)):" -ForegroundColor Red
        Write-Host $reader.ReadToEnd()
    }
    else {
        Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}

# Decode the response as UTF-8 explicitly (Windows PowerShell may guess wrong)
$stream = $response.RawContentStream
$stream.Position = 0
$json = (New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)).ReadToEnd()
$result = $json | ConvertFrom-Json

if ($result.stop_reason -eq "refusal") {
    Write-Host "The model declined the request." -ForegroundColor Yellow
    exit 1
}

$text = ($result.content | Where-Object { $_.type -eq "text" } | ForEach-Object { $_.text }) -join ""

Write-Host "Model: $($result.model)"
Write-Host "Reply: $text" -ForegroundColor Green
