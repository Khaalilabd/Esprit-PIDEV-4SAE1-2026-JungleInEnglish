# Fix Pack Enrollment Dates
$env:PGPASSWORD = "root"
$dbName = "englishflow_courses"
$username = "postgres"

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "  Fixing Pack Enrollment Dates" -ForegroundColor Yellow
Write-Host "=============================================================" -ForegroundColor Cyan

# Try to find psql
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        Write-Host "Found psql at: $path" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    # Try psql in PATH
    $cmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($cmd) {
        $psqlPath = "psql"
        Write-Host "Found psql in system PATH" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERROR: Could not find psql.exe" -ForegroundColor Red
        Write-Host "Please run the SQL manually in update-pack-enrollment-dates.sql" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host "Updating enrollment dates..." -ForegroundColor Yellow

# Execute the SQL
& $psqlPath -U $username -d $dbName -f "update-pack-enrollment-dates.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Enrollment dates updated!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update" -ForegroundColor Red
    Write-Host ""
}

$env:PGPASSWORD = ""
Write-Host "=============================================================" -ForegroundColor Cyan
