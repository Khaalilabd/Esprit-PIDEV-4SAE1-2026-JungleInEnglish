# Reset Courses Database Script
$env:PGPASSWORD = "root"
$PGUSER = "postgres"
$PGHOST = "localhost"
$PGPORT = "5432"
$DBNAME = "englishflow_courses"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resetting Courses Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find psql in common PostgreSQL installation paths
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
)

$psql = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psql = $path
        break
    }
}

if (-not $psql) {
    Write-Host "ERROR: psql not found. Please install PostgreSQL or add it to PATH" -ForegroundColor Red
    exit 1
}

Write-Host "Using psql: $psql" -ForegroundColor Green
Write-Host ""

Write-Host "Dropping existing database..." -ForegroundColor Yellow
& $psql -U $PGUSER -h $PGHOST -p $PGPORT -c "DROP DATABASE IF EXISTS $DBNAME;"

Write-Host "Creating new database..." -ForegroundColor Yellow
& $psql -U $PGUSER -h $PGHOST -p $PGPORT -c "CREATE DATABASE $DBNAME;"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Database reset complete!" -ForegroundColor Green
Write-Host "Now restart courses-service to create tables" -ForegroundColor Green
Write-Host "Then run: .\seed-db.ps1" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
