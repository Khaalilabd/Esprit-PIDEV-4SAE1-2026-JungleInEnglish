-- Check pack status and enrollment details
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
        THEN 'OPEN'
        ELSE 'CLOSED'
    END as enrollment_status
FROM packs;

-- Update pack status to ACTIVE if needed
-- UPDATE packs SET status = 'ACTIVE' WHERE id = 1;
