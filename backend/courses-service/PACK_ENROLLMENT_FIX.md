# Pack Enrollment Fix Documentation

## Problem Summary

Pack enrollment was failing with a 503 Service Unavailable error, which was caused by two issues:

1. **Courses-service crashed** - Port 8086 was already in use by a zombie process
2. **Enrollment dates issue** - Pack enrollment start date was set to a future time (12:23 PM) while current time was 09:05 AM

## Root Cause

The `Pack.isEnrollmentOpen()` method checks:
- Pack status must be ACTIVE ✓
- Pack must not be full ✓
- Current date must be AFTER enrollment start date ✗ (This was failing)
- Current date must be BEFORE enrollment end date ✓

## Solution Applied

### 1. Restarted Courses Service
- Killed the zombie process on port 8086
- Restarted courses-service successfully on terminal 9
- Service registered with Eureka and is responding

### 2. Updated Enrollment Dates
Executed SQL script to update pack enrollment dates:

```sql
UPDATE packs 
SET 
    enrollment_start_date = NOW() - INTERVAL '1 day',
    enrollment_end_date = NOW() + INTERVAL '90 days',
    updated_at = NOW()
WHERE id = 1;
```

**Result:**
- Enrollment start date: 2026-02-27 09:14:47 (yesterday)
- Enrollment end date: 2026-05-29 09:14:47 (90 days from now)
- `isEnrollmentOpen`: true ✓

## Verification

### Pack Status Check
```bash
curl http://localhost:8088/api/packs/1
```

Response shows:
```json
{
  "id": 1,
  "name": "General English B1 - Aziz Louati",
  "status": "ACTIVE",
  "isEnrollmentOpen": true,
  "availableSlots": 10
}
```

### Enrollment Test
```bash
curl -X POST "http://localhost:8088/api/pack-enrollments?studentId=14&packId=1"
```

Response: 201 Created ✓

### Enrollment Verification
```bash
curl "http://localhost:8088/api/pack-enrollments/pack/1"
```

Shows enrolled student with:
- Student ID: 14
- Status: ACTIVE
- Progress: 0%
- Total Courses: 2

## Scripts Created

### 1. `fix-enrollment-dates.ps1`
PowerShell script to automatically update pack enrollment dates.

**Usage:**
```powershell
cd backend/courses-service
./fix-enrollment-dates.ps1
```

### 2. `update-pack-enrollment-dates.sql`
SQL script to manually update enrollment dates if needed.

**Usage:**
```sql
-- In pgAdmin or psql
\i update-pack-enrollment-dates.sql
```

### 3. `check-pack-enrollment.sql`
SQL script to check pack enrollment status.

## Future Prevention

To avoid this issue in the future:

1. **When creating packs**, ensure enrollment dates are set correctly:
   - Start date should be in the past or current time
   - End date should be in the future
   - Or leave dates as NULL to allow enrollment anytime

2. **Pack Status Management**:
   - DRAFT: Not available for enrollment
   - ACTIVE: Available for enrollment (if dates allow)
   - ARCHIVED: No longer available

3. **Frontend Validation**:
   - Show clear error messages when enrollment is not open
   - Display enrollment start/end dates to users
   - Show countdown if enrollment hasn't started yet

## API Endpoints

### Check Pack Details
```
GET /api/packs/{id}
```

### Enroll Student
```
POST /api/pack-enrollments?studentId={studentId}&packId={packId}
```

### Get Pack Enrollments
```
GET /api/pack-enrollments/pack/{packId}
```

### Get Student Enrollments
```
GET /api/pack-enrollments/student/{studentId}
```

### Check if Student is Enrolled
```
GET /api/pack-enrollments/check?studentId={studentId}&packId={packId}
```

## Status

✅ **RESOLVED** - Pack enrollment is now working correctly.

Students can now enroll in packs through the frontend at:
- Public pack details page: `http://localhost:4200/packs/{id}`
- Academic panel pack details: `http://localhost:4200/dashboard/packs/{id}`
