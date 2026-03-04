# Quick script to recreate missing tables
# Usage: .\quick-recreate-tables.ps1

$env:PGPASSWORD = "root"

Write-Host "Recreating database tables..." -ForegroundColor Cyan

psql -h localhost -p 5432 -U postgres -d englishflow -c "
-- Drop and recreate tables
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS pack_enrollments CASCADE;
DROP TABLE IF EXISTS course_enrollments CASCADE;
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

-- Pack Courses (Many-to-Many)
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

-- Course Enrollments (REFACTORED)
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

-- Pack Enrollments (REFACTORED)
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

-- Chapter Objectives
CREATE TABLE chapter_objectives (
    chapter_id BIGINT NOT NULL,
    objective TEXT NOT NULL,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Create Indexes
CREATE INDEX idx_courses_tutor_id ON courses(tutor_id);
CREATE INDEX idx_packs_tutor_id ON packs(tutor_id);
CREATE INDEX idx_chapters_course_id ON chapters(course_id);
CREATE INDEX idx_lessons_chapter_id ON lessons(chapter_id);
CREATE INDEX idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_pack_enrollments_student_id ON pack_enrollments(student_id);
CREATE INDEX idx_pack_enrollments_pack_id ON pack_enrollments(pack_id);
CREATE INDEX idx_lesson_progress_student_id ON lesson_progress(student_id);
CREATE INDEX idx_lesson_progress_course_id ON lesson_progress(course_id);
CREATE INDEX idx_lesson_progress_student_course ON lesson_progress(student_id, course_id);

SELECT 'Tables recreated successfully!' as status;
"

Remove-Item Env:\PGPASSWORD

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Success! Tables recreated." -ForegroundColor Green
    Write-Host ""
    Write-Host "Now restart your courses-service" -ForegroundColor Yellow
} else {
    Write-Host "✗ Error! Check the output above." -ForegroundColor Red
}
