# ================================================================================
# RECREATE MISSING DATABASE TABLES
# ================================================================================
# This script recreates tables that were accidentally deleted from the database
# Run this script to restore the database schema
# ================================================================================

# Database connection parameters
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "englishflow"
$DB_USER = "postgres"
$DB_PASSWORD = "root"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RECREATE MISSING DATABASE TABLES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set PGPASSWORD environment variable to avoid password prompt
$env:PGPASSWORD = $DB_PASSWORD

Write-Host "Connecting to database: $DB_NAME" -ForegroundColor Yellow
Write-Host ""

# SQL script to recreate all tables
$SQL_SCRIPT = @"
-- ================================================================================
-- RECREATE ALL TABLES FOR COURSES SERVICE
-- ================================================================================

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS pack_enrollments CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS pack_courses CASCADE;
DROP TABLE IF EXISTS packs CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS course_categories CASCADE;

-- ================================================================================
-- 1. COURSE CATEGORIES TABLE
-- ================================================================================
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

-- ================================================================================
-- 2. COURSES TABLE
-- ================================================================================
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

CREATE INDEX idx_courses_tutor_id ON courses(tutor_id);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_is_published ON courses(is_published);

-- ================================================================================
-- 3. PACKS TABLE
-- ================================================================================
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

CREATE INDEX idx_packs_tutor_id ON packs(tutor_id);
CREATE INDEX idx_packs_category ON packs(category);
CREATE INDEX idx_packs_is_published ON packs(is_published);

-- ================================================================================
-- 4. PACK_COURSES TABLE (Many-to-Many relationship)
-- ================================================================================
CREATE TABLE pack_courses (
    pack_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    PRIMARY KEY (pack_id, course_id),
    FOREIGN KEY (pack_id) REFERENCES packs(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX idx_pack_courses_pack_id ON pack_courses(pack_id);
CREATE INDEX idx_pack_courses_course_id ON pack_courses(course_id);

-- ================================================================================
-- 5. CHAPTERS TABLE
-- ================================================================================
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

CREATE INDEX idx_chapters_course_id ON chapters(course_id);
CREATE INDEX idx_chapters_order_index ON chapters(order_index);

-- ================================================================================
-- 6. LESSONS TABLE
-- ================================================================================
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

CREATE INDEX idx_lessons_chapter_id ON lessons(chapter_id);
CREATE INDEX idx_lessons_order_index ON lessons(order_index);
CREATE INDEX idx_lessons_is_published ON lessons(is_published);

-- ================================================================================
-- 7. COURSE_ENROLLMENTS TABLE (REFACTORED - NO CALCULATED FIELDS)
-- ================================================================================
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

CREATE INDEX idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_is_active ON course_enrollments(is_active);

-- ================================================================================
-- 8. PACK_ENROLLMENTS TABLE (REFACTORED - NO CALCULATED FIELDS)
-- ================================================================================
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

CREATE INDEX idx_pack_enrollments_student_id ON pack_enrollments(student_id);
CREATE INDEX idx_pack_enrollments_pack_id ON pack_enrollments(pack_id);
CREATE INDEX idx_pack_enrollments_tutor_id ON pack_enrollments(tutor_id);
CREATE INDEX idx_pack_enrollments_is_active ON pack_enrollments(is_active);

-- ================================================================================
-- 9. LESSON_PROGRESS TABLE (SOURCE OF TRUTH)
-- ================================================================================
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

CREATE INDEX idx_lesson_progress_student_id ON lesson_progress(student_id);
CREATE INDEX idx_lesson_progress_course_id ON lesson_progress(course_id);
CREATE INDEX idx_lesson_progress_student_course ON lesson_progress(student_id, course_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

-- ================================================================================
-- 10. CHAPTER_OBJECTIVES TABLE (for storing chapter objectives)
-- ================================================================================
CREATE TABLE chapter_objectives (
    chapter_id BIGINT NOT NULL,
    objective TEXT NOT NULL,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE INDEX idx_chapter_objectives_chapter_id ON chapter_objectives(chapter_id);

-- ================================================================================
-- GRANT PERMISSIONS
-- ================================================================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ================================================================================
-- VERIFICATION
-- ================================================================================
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
SELECT 'lesson_progress', COUNT(*) FROM lesson_progress;

"@

# Save SQL script to temporary file
$TempSqlFile = "temp_recreate_tables.sql"
$SQL_SCRIPT | Out-File -FilePath $TempSqlFile -Encoding UTF8

Write-Host "Executing SQL script..." -ForegroundColor Yellow
Write-Host ""

# Execute SQL script using psql
try {
    $result = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $TempSqlFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Tables recreated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Table verification:" -ForegroundColor Cyan
        Write-Host $result
    } else {
        Write-Host "✗ Error recreating tables!" -ForegroundColor Red
        Write-Host $result
        exit 1
    }
} catch {
    Write-Host "✗ Error executing SQL script: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up temporary file
    if (Test-Path $TempSqlFile) {
        Remove-Item $TempSqlFile
    }
    
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TABLES RECREATED SUCCESSFULLY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart the courses-service" -ForegroundColor White
Write-Host "2. Check the service logs for any errors" -ForegroundColor White
Write-Host "3. Verify that the application works correctly" -ForegroundColor White
Write-Host ""
Write-Host "Note: All data in the deleted tables has been lost." -ForegroundColor Red
Write-Host "You may need to re-seed data or re-enroll students." -ForegroundColor Red
Write-Host ""
"@
