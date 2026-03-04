# ================================================================================
# BACKUP, RECREATE TABLES, AND RESTORE DATA
# ================================================================================
# This script will:
# 1. Backup all current data from the database
# 2. Drop and recreate tables with the new refactored schema
# 3. Restore all data back to the new tables
# ================================================================================

$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "englishflow"
$DB_USER = "postgres"
$DB_PASSWORD = "root"

$BACKUP_DIR = "database_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKUP AND RECREATE DATABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set password
$env:PGPASSWORD = $DB_PASSWORD

# Create backup directory
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null
Write-Host "Created backup directory: $BACKUP_DIR" -ForegroundColor Green
Write-Host ""

# ================================================================================
# STEP 1: BACKUP EXISTING DATA
# ================================================================================
Write-Host "STEP 1: Backing up existing data..." -ForegroundColor Yellow
Write-Host ""

$tables = @(
    "course_categories",
    "courses",
    "packs",
    "pack_courses",
    "chapters",
    "lessons",
    "course_enrollments",
    "pack_enrollments",
    "lesson_progress",
    "chapter_objectives"
)

foreach ($table in $tables) {
    Write-Host "  Backing up $table..." -ForegroundColor Gray
    
    $backupFile = "$BACKUP_DIR/$table.sql"
    
    # Check if table exists
    $tableExists = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table');" 2>$null
    
    if ($tableExists -match "t") {
        # Export data as INSERT statements
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\COPY (SELECT * FROM $table) TO '$backupFile' WITH CSV HEADER" 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            $rowCount = (Get-Content $backupFile | Measure-Object -Line).Lines - 1
            Write-Host "    ✓ Backed up $rowCount rows" -ForegroundColor Green
        } else {
            Write-Host "    ⚠ Table might be empty or doesn't exist" -ForegroundColor Yellow
        }
    } else {
        Write-Host "    ⚠ Table doesn't exist, skipping" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✓ Backup completed!" -ForegroundColor Green
Write-Host ""

# ================================================================================
# STEP 2: RECREATE TABLES WITH NEW SCHEMA
# ================================================================================
Write-Host "STEP 2: Recreating tables with new schema..." -ForegroundColor Yellow
Write-Host ""

$recreateSQL = @"
-- Drop existing tables
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS pack_enrollments CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS chapter_objectives CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS pack_courses CASCADE;
DROP TABLE IF EXISTS packs CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS course_categories CASCADE;

-- Course Categories
CREATE TABLE course_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses
CREATE TABLE courses (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    level VARCHAR(50),
    language VARCHAR(50),
    duration_hours INTEGER,
    max_students INTEGER,
    price DECIMAL(10, 2),
    thumbnail_url VARCHAR(500),
    is_published BOOLEAN NOT NULL DEFAULT false,
    tutor_id BIGINT NOT NULL,
    tutor_name VARCHAR(255),
    enrollment_count INTEGER DEFAULT 0,
    rating DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Packs
CREATE TABLE packs (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    level VARCHAR(50),
    tutor_id BIGINT NOT NULL,
    tutor_name VARCHAR(255),
    price DECIMAL(10, 2),
    discount_percentage INTEGER DEFAULT 0,
    max_students INTEGER,
    enrollment_count INTEGER DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT false,
    enrollment_start_date TIMESTAMP,
    enrollment_end_date TIMESTAMP,
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pack Courses
CREATE TABLE pack_courses (
    pack_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    PRIMARY KEY (pack_id, course_id),
    FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Chapters
CREATE TABLE chapters (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    estimated_duration INTEGER,
    is_published BOOLEAN NOT NULL DEFAULT false,
    course_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Lessons
CREATE TABLE lessons (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lesson_type VARCHAR(50) NOT NULL,
    content TEXT,
    video_url VARCHAR(500),
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL,
    is_preview BOOLEAN DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT false,
    chapter_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Chapter Objectives
CREATE TABLE chapter_objectives (
    chapter_id BIGINT NOT NULL,
    objective TEXT NOT NULL,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Course Enrollments (REFACTORED - NO calculated fields)
CREATE TABLE course_enrollments (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    total_lessons INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE (student_id, course_id)
);

-- Pack Enrollments (REFACTORED - NO calculated fields)
CREATE TABLE pack_enrollments (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    pack_id BIGINT NOT NULL,
    pack_name VARCHAR(255) NOT NULL,
    pack_category VARCHAR(100) NOT NULL,
    pack_level VARCHAR(50) NOT NULL,
    tutor_id BIGINT NOT NULL,
    tutor_name VARCHAR(255) NOT NULL,
    total_courses INTEGER NOT NULL DEFAULT 0,
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_active BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE CASCADE,
    UNIQUE (student_id, pack_id)
);

-- Lesson Progress (SOURCE OF TRUTH)
CREATE TABLE lesson_progress (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL,
    lesson_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP,
    time_spent INTEGER,
    last_accessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE (student_id, lesson_id)
);

-- Create Indexes
CREATE INDEX idx_courses_tutor_id ON courses(tutor_id);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_is_published ON courses(is_published);
CREATE INDEX idx_packs_tutor_id ON packs(tutor_id);
CREATE INDEX idx_packs_category ON packs(category);
CREATE INDEX idx_packs_is_published ON packs(is_published);
CREATE INDEX idx_chapters_course_id ON chapters(course_id);
CREATE INDEX idx_lessons_chapter_id ON lessons(chapter_id);
CREATE INDEX idx_lessons_is_published ON lessons(is_published);
CREATE INDEX idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_pack_enrollments_student_id ON pack_enrollments(student_id);
CREATE INDEX idx_pack_enrollments_pack_id ON pack_enrollments(pack_id);
CREATE INDEX idx_lesson_progress_student_id ON lesson_progress(student_id);
CREATE INDEX idx_lesson_progress_course_id ON lesson_progress(course_id);
CREATE INDEX idx_lesson_progress_student_course ON lesson_progress(student_id, course_id);
"@

$recreateSQL | Out-File -FilePath "$BACKUP_DIR/recreate_schema.sql" -Encoding UTF8

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$BACKUP_DIR/recreate_schema.sql" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Tables recreated successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Error recreating tables!" -ForegroundColor Red
    Remove-Item Env:\PGPASSWORD
    exit 1
}

Write-Host ""

# ================================================================================
# STEP 3: RESTORE DATA
# ================================================================================
Write-Host "STEP 3: Restoring data..." -ForegroundColor Yellow
Write-Host ""

# Restore in correct order (respecting foreign keys)
$restoreOrder = @(
    "course_categories",
    "courses",
    "packs",
    "pack_courses",
    "chapters",
    "chapter_objectives",
    "lessons",
    "course_enrollments",
    "pack_enrollments",
    "lesson_progress"
)

foreach ($table in $restoreOrder) {
    $backupFile = "$BACKUP_DIR/$table.sql"
    
    if (Test-Path $backupFile) {
        Write-Host "  Restoring $table..." -ForegroundColor Gray
        
        # Check if file has data (more than just header)
        $lineCount = (Get-Content $backupFile | Measure-Object -Line).Lines
        
        if ($lineCount -gt 1) {
            psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\COPY $table FROM '$backupFile' WITH CSV HEADER" 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                $rowCount = $lineCount - 1
                Write-Host "    ✓ Restored $rowCount rows" -ForegroundColor Green
                
                # Reset sequence for tables with auto-increment IDs
                if ($table -ne "pack_courses" -and $table -ne "chapter_objectives") {
                    $maxId = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COALESCE(MAX(id), 0) FROM $table;" 2>$null
                    if ($maxId -match "\d+") {
                        $nextVal = [int]$maxId.Trim() + 1
                        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT setval('${table}_id_seq', $nextVal, false);" 2>&1 | Out-Null
                    }
                }
            } else {
                Write-Host "    ✗ Error restoring data" -ForegroundColor Red
            }
        } else {
            Write-Host "    ⚠ No data to restore" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠ No backup file for $table" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✓ Data restoration completed!" -ForegroundColor Green
Write-Host ""

# ================================================================================
# STEP 4: VERIFICATION
# ================================================================================
Write-Host "STEP 4: Verifying data..." -ForegroundColor Yellow
Write-Host ""

$verifySQL = @"
SELECT 
    'course_categories' as table_name, COUNT(*) as row_count FROM course_categories
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'packs', COUNT(*) FROM packs
UNION ALL
SELECT 'pack_courses', COUNT(*) FROM pack_courses
UNION ALL
SELECT 'chapters', COUNT(*) FROM chapters
UNION ALL
SELECT 'lessons', COUNT(*) FROM lessons
UNION ALL
SELECT 'course_enrollments', COUNT(*) FROM course_enrollments
UNION ALL
SELECT 'pack_enrollments', COUNT(*) FROM pack_enrollments
UNION ALL
SELECT 'lesson_progress', COUNT(*) FROM lesson_progress
ORDER BY table_name;
"@

Write-Host "Table row counts:" -ForegroundColor Cyan
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$verifySQL"

Write-Host ""

# Clean up
Remove-Item Env:\PGPASSWORD

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRATION COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backup location: $BACKUP_DIR" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart the courses-service" -ForegroundColor White
Write-Host "2. Test the application" -ForegroundColor White
Write-Host "3. Verify progress calculations work correctly" -ForegroundColor White
Write-Host ""
Write-Host "Note: Progress fields (progress, completedLessons, progressPercentage)" -ForegroundColor Cyan
Write-Host "      are now calculated dynamically and no longer stored in the database." -ForegroundColor Cyan
Write-Host ""
