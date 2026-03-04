-- ================================================================================
-- PROGRESS TRACKING REFACTORING MIGRATION
-- ================================================================================
-- This migration removes calculated/persisted progress fields and simplifies
-- the progress tracking system to use LessonProgress as the single source of truth.
--
-- BACKUP YOUR DATABASE BEFORE RUNNING THIS MIGRATION!
-- ================================================================================

-- Step 1: Add constraints and indexes to lesson_progress table
-- ================================================================================

-- Add unique constraint on (student_id, lesson_id) if not exists
ALTER TABLE lesson_progress 
ADD CONSTRAINT uk_student_lesson UNIQUE (student_id, lesson_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_id ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id ON lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_course ON lesson_progress(student_id, course_id);

-- Step 2: Drop chapter_progress table (no longer needed)
-- ================================================================================

DROP TABLE IF EXISTS chapter_progress CASCADE;

-- Step 3: Remove calculated fields from course_enrollments
-- ================================================================================

-- Remove progress and completed_lessons columns (now calculated dynamically)
ALTER TABLE course_enrollments 
DROP COLUMN IF EXISTS progress;

ALTER TABLE course_enrollments 
DROP COLUMN IF EXISTS completed_lessons;

-- Keep: total_lessons, completed_at, enrolled_at, is_active, last_accessed_at

-- Step 4: Remove calculated fields from pack_enrollments
-- ================================================================================

-- Remove progress_percentage and completed_courses columns (now calculated dynamically)
ALTER TABLE pack_enrollments 
DROP COLUMN IF EXISTS progress_percentage;

ALTER TABLE pack_enrollments 
DROP COLUMN IF EXISTS completed_courses;

-- Keep: status, enrolled_at, completed_at, is_active, total_courses

-- ================================================================================
-- MIGRATION COMPLETE
-- ================================================================================
-- After this migration:
-- - LessonProgress is the single source of truth
-- - Course progress is calculated as: (completed lessons / total lessons) × 100
-- - Pack progress is calculated as: (total completed lessons / total lessons) × 100
-- - All progress values are computed dynamically, not persisted
-- ================================================================================
