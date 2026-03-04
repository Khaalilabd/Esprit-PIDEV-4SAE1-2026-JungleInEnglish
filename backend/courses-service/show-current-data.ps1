# ================================================================================
# SHOW CURRENT DATABASE DATA
# ================================================================================
# This script displays all current data in your database
# ================================================================================

$env:PGPASSWORD = "root"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CURRENT DATABASE DATA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Table counts
Write-Host "TABLE ROW COUNTS:" -ForegroundColor Yellow
Write-Host ""
psql -h localhost -p 5432 -U postgres -d englishflow -c "
SELECT 
    table_name,
    (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I', table_name), false, true, '')))[1]::text::int AS row_count
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'course_categories',
    'courses', 
    'packs',
    'pack_courses',
    'chapters',
    'lessons',
    'course_enrollments',
    'pack_enrollments',
    'lesson_progress',
    'chapter_objectives'
  )
ORDER BY table_name;
"

Write-Host ""
Write-Host "COURSE CATEGORIES:" -ForegroundColor Yellow
psql -h localhost -p 5432 -U postgres -d englishflow -c "SELECT id, name, icon, color, is_active FROM course_categories ORDER BY id;"

Write-Host ""
Write-Host "COURSES:" -ForegroundColor Yellow
psql -h localhost -p 5432 -U postgres -d englishflow -c "SELECT id, title, category, level, tutor_name, is_published FROM courses ORDER BY id;"

Write-Host ""
Write-Host "PACKS:" -ForegroundColor Yellow
psql -h localhost -p 5432 -U postgres -d englishflow -c "SELECT id, name, category, level, tutor_name, is_published FROM packs ORDER BY id;"

Write-Host ""
Write-Host "CHAPTERS:" -ForegroundColor Yellow
psql -h localhost -p 5432 -U postgres -d englishflow -c "SELECT id, title, course_id, order_index, is_published FROM chapters ORDER BY course_id, order_index LIMIT 20;"

Write-Host ""
Write-Host "LESSONS:" -ForegroundColor Yellow
psql -h localhost -p 5432 -U postgres -d englishflow -c "SELECT id, title, chapter_id, lesson_type, order_index, is_published FROM lessons ORDER BY chapter_id, order_index LIMIT 20;"

Write-Host ""
Write-Host "COURSE ENROLLMENTS:" -ForegroundColor Yellow
psql -h localhost -p 5432 -U postgres -d englishflow -c "SELECT id, student_id, course_id, enrolled_at, is_active FROM course_enrollments ORDER BY id LIMIT 20;"

Write-Host ""
Write-Host "PACK ENROLLMENTS:" -ForegroundColor Yellow
psql -h localhost -p 5432 -U postgres -d englishflow -c "SELECT id, student_id, pack_id, pack_name, status, enrolled_at FROM pack_enrollments ORDER BY id LIMIT 20;"

Write-Host ""
Write-Host "LESSON PROGRESS:" -ForegroundColor Yellow
psql -h localhost -p 5432 -U postgres -d englishflow -c "SELECT id, student_id, lesson_id, course_id, is_completed FROM lesson_progress ORDER BY id LIMIT 20;"

Remove-Item Env:\PGPASSWORD

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  END OF DATA DISPLAY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
