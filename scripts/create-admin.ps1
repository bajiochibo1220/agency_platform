param([switch]$Local)
$ErrorActionPreference = 'Stop'
$agencyBackend = Join-Path (Split-Path -Parent $PSScriptRoot) 'backend'
$agencyPrevious = @{}
foreach ($agencyKey in @('LOCAL_DEVELOPMENT','DATABASE_URL','MEDIA_STORAGE','ENVIRONMENT')) {
    $agencyPrevious[$agencyKey] = [Environment]::GetEnvironmentVariable($agencyKey, 'Process')
}
if ($Local) {
    $env:LOCAL_DEVELOPMENT = 'true'
    $env:DATABASE_URL = ''
    $env:MEDIA_STORAGE = 'local'
    $env:ENVIRONMENT = 'development'
}
Push-Location $agencyBackend
try {
    & ./.venv/Scripts/python.exe -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) { throw 'Migration failed.' }
    & ./.venv/Scripts/python.exe manage.py create-admin
    if ($LASTEXITCODE -ne 0) { throw 'Admin creation failed.' }
} finally {
    Pop-Location
    foreach ($agencyKey in $agencyPrevious.Keys) {
        [Environment]::SetEnvironmentVariable($agencyKey, $agencyPrevious[$agencyKey], 'Process')
    }
}
