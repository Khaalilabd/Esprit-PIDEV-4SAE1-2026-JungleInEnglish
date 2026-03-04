# Force Reset Courses Database Script
$env:PGPASSWORD = "root"
$PGUSER = "postgres"
$PGHOST = "localhost"
$PGPORT = "5432"
$DBNAME = "englishflow_courses"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Force Resetting Courses Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find psql
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe"
)

$psql = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psql = $path
        break
    }
}

if (-not $psql) {
    Write-Host "ERROR: psql not found" -ForegroundColor Red
    exit 1
}

Write-Host "Terminating all connections to database..." -ForegroundColor Yellow
& $psql -U $PGUSER -h $PGHOST -p $PGPORT -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DBNAME' AND pid <> pg_backend_pid();"

Write-Host "Dropping existing database..." -ForegroundColor Yellow
& $psql -U $PGUSER -h $PGHOST -p $PGPORT -d postgres -c "DROP DATABASE IF EXISTS $DBNAME;"

Write-Host "Creating new database..." -ForegroundColor Yellow
& $psql -U $PGUSER -h $PGHOST -p $PGPORT -d postgres -c "CREATE DATABASE $DBNAME;"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Database reset complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
