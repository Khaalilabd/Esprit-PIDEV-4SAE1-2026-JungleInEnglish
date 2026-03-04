# Fix Pack Enrollment Status
# This script updates packs to ACTIVE status to allow enrollment

$env:PGPASSWORD = "root"
$dbName = "englishflow_courses"
$username = "postgres"

Write-Host "Fixing pack enrollment status..." -ForegroundColor Cyan

# Try to find psql in common PostgreSQL installation paths
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
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
    Write-Host "ERROR: Could not find psql.exe. Please ensure PostgreSQL is installed." -ForegroundColor Red
    Write-Host "You can manually run the SQL commands in fix-pack-status.sql" -ForegroundColor Yellow
    exit 1
}

# Execute the SQL script
Write-Host "Updating pack status to ACTIVE..." -ForegroundColor Yellow
& $psqlPath -U $username -d $dbName -f "fix-pack-status.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Pack status updated successfully!" -ForegroundColor Green
    Write-Host "Packs are now ready for enrollment." -ForegroundColor Cyan
} else {
    Write-Host "✗ Failed to update pack status." -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
}

# Clear password
$env:PGPASSWORD = ""
