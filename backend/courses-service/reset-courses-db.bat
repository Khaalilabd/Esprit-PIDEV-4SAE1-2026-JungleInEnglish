@echo off
echo ========================================
echo Resetting Courses Database
echo ========================================
echo.

REM Set PostgreSQL connection details
set PGPASSWORD=root
set PGHOST=localhost
set PGPORT=5432
set PGUSER=postgres
set DBNAME=englishflow_courses

echo Dropping existing database...
psql -U %PGUSER% -h %PGHOST% -p %PGPORT% -c "DROP DATABASE IF EXISTS %DBNAME%;"

echo Creating new database...
psql -U %PGUSER% -h %PGHOST% -p %PGPORT% -c "CREATE DATABASE %DBNAME%;"

echo Seeding database with new courses...
psql -U %PGUSER% -h %PGHOST% -p %PGPORT% -d %DBNAME% -f seed-courses-tutor11.sql

echo.
echo ========================================
echo Database reset complete!
echo ========================================
pause
