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

echo.
echo ========================================
echo Database reset complete!
echo Now restart the courses-service to auto-create tables and categories
echo Then run: psql -U postgres -d englishflow_courses -f seed-courses-tutor11.sql
echo ========================================
pause
