# Seed Courses Database Script
$env:PGPASSWORD = "root"
$PGUSER = "postgres"
$PGHOST = "localhost"
$PGPORT = "5432"
$DBNAME = "englishflow_courses"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Seeding Courses Database" -ForegroundColor Cyan
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

Write-Host "Seeding database with courses..." -ForegroundColor Yellow
& $psql -U $PGUSER -h $PGHOST -p $PGPORT -d $DBNAME -f "seed-courses-tutor11.sql"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Database seeding complete!" -ForegroundColor Green
Write-Host "5 courses with rich content added for Tutor ID 11" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
