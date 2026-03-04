-- Fix pack status to allow enrollment
-- This script updates all packs to ACTIVE status and sets reasonable enrollment dates

UPDATE packs 
SET 
    status = 'ACTIVE',
    enrollment_start_date = NOW() - INTERVAL '1 day',  -- Started yesterday
    enrollment_end_date = NOW() + INTERVAL '90 days'   -- Ends in 90 days
WHERE status = 'DRAFT';

-- Verify the changes
SELECT 
    id, 
    name, 
    status, 
    max_students, 
    current_enrolled_students,
    (max_students - current_enrolled_students) as available_slots,
    enrollment_start_date, 
    enrollment_end_date,
    CASE 
        WHEN status = 'ACTIVE' AND current_enrolled_students < max_students 
            AND (enrollment_start_date IS NULL OR enrollment_start_date <= NOW())
            AND (enrollment_end_date IS NULL OR enrollment_end_date >= NOW())
        THEN 'OPEN ✓'
        ELSE 'CLOSED ✗'
    END as enrollment_status
FROM packs;
