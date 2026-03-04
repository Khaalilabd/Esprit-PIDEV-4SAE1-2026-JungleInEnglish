-- Update pack enrollment dates to allow immediate enrollment
-- Set start date to yesterday and end date to 90 days from now

UPDATE packs 
SET 
    enrollment_start_date = NOW() - INTERVAL '1 day',
    enrollment_end_date = NOW() + INTERVAL '90 days',
    updated_at = NOW()
WHERE id = 1;

-- Verify the changes
SELECT 
    id, 
    name, 
    status, 
    enrollment_start_date, 
    enrollment_end_date,
    NOW() as current_time,
    CASE 
        WHEN status = 'ACTIVE' 
            AND current_enrolled_students < max_students 
            AND (enrollment_start_date IS NULL OR enrollment_start_date <= NOW())
            AND (enrollment_end_date IS NULL OR enrollment_end_date >= NOW())
        THEN 'OPEN ✓'
        ELSE 'CLOSED ✗'
    END as enrollment_status
FROM packs
WHERE id = 1;
