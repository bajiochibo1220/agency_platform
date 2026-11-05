$ErrorActionPreference = 'Stop'
$agencyRoot = Split-Path -Parent $PSScriptRoot
Push-Location $agencyRoot
try {
    python -m venv backend/.venv
    if ($LASTEXITCODE -ne 0) { throw 'Python environment setup failed.' }
    & ./backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.lock.txt
    if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed.' }
    npm ci --prefix frontend
    if ($LASTEXITCODE -ne 0) { throw 'Frontend installation failed.' }
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'Test dependency installation failed.' }
    Write-Host 'Setup complete. Fill .env for Neon + Cloudinary, then run npm run dev.'
    Write-Host 'For an isolated local preview instead, run npm run dev:local.'
} finally { Pop-Location }
