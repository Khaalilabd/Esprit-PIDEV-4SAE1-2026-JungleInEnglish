-- Check current pack statuses
SELECT id, name, status, current_enrolled_students, max_students, enrollment_start_date, enrollment_end_date
FROM packs;

-- Update pack status to ACTIVE (change the ID as needed)
-- UPDATE packs SET status = 'ACTIVE' WHERE id = 1;
