# Clean and Re-seed Exams
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clean and Re-seed Exam Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8084"

Write-Host "`nStep 1: Getting all existing exams..." -ForegroundColor Yellow
try {
    $exams = Invoke-RestMethod -Uri "$baseUrl/exams" -Method Get
    Write-Host "Found $($exams.Count) exams" -ForegroundColor Green
    
    if ($exams.Count -gt 0) {
        Write-Host "`nStep 2: Deleting existing exams..." -ForegroundColor Yellow
        foreach ($exam in $exams) {
            try {
                Invoke-RestMethod -Uri "$baseUrl/exams/$($exam.id)" -Method Delete
                Write-Host "  Deleted: $($exam.title)" -ForegroundColor Green
            } catch {
                Write-Host "  Failed to delete $($exam.title)" -ForegroundColor Red
            }
        }
    }
    
} catch {
    Write-Host "Error getting exams" -ForegroundColor Red
}

Write-Host "`nStep 3: Creating ONE working exam..." -ForegroundColor Yellow

$examJson = @"
{
    "title": "CEFR A1 English Test - Everyday Situations",
    "level": "A1",
    "description": "A comprehensive A1 level test",
    "totalDuration": 60,
    "passingScore": 60.0
}
"@

try {
    $exam = Invoke-RestMethod -Uri "$baseUrl/exams" -Method Post -Body $examJson -ContentType "application/json"
    Write-Host "Created exam: $($exam.title)" -ForegroundColor Green
    Write-Host "  Exam ID: $($exam.id)" -ForegroundColor Gray
    
    # Create Part 1
    Write-Host "`nCreating Part 1..." -ForegroundColor Yellow
    $part1Json = @"
{
    "title": "Reading Comprehension",
    "partType": "READING",
    "instructions": "Read the text and answer the questions",
    "orderIndex": 0,
    "readingText": "My name is Sarah. I am a teacher. I am 25 years old. I have one brother and one sister. My brother is 22 and my sister is 28. We live in London. I like my job very much."
}
"@
    
    $part1 = Invoke-RestMethod -Uri "$baseUrl/exam-parts/exam/$($exam.id)" -Method Post -Body $part1Json -ContentType "application/json"
    Write-Host "Created part: $($part1.title)" -ForegroundColor Green
    
    # Create Question 1
    Write-Host "`nCreating questions..." -ForegroundColor Yellow
    $q1Json = @"
{
    "questionType": "MULTIPLE_CHOICE",
    "prompt": "What is Sarah job?",
    "orderIndex": 0,
    "points": 2.0,
    "options": [
        {"label": "Doctor", "orderIndex": 0, "isCorrect": false},
        {"label": "Teacher", "orderIndex": 1, "isCorrect": true},
        {"label": "Student", "orderIndex": 2, "isCorrect": false},
        {"label": "Engineer", "orderIndex": 3, "isCorrect": false}
    ]
}
"@
    
    $q1 = Invoke-RestMethod -Uri "$baseUrl/questions/part/$($part1.id)" -Method Post -Body $q1Json -ContentType "application/json"
    Write-Host "  Question 1 created" -ForegroundColor Green
    
    # Create Question 2
    $q2Json = @"
{
    "questionType": "MULTIPLE_CHOICE",
    "prompt": "How old is Sarah?",
    "orderIndex": 1,
    "points": 2.0,
    "options": [
        {"label": "22", "orderIndex": 0, "isCorrect": false},
        {"label": "25", "orderIndex": 1, "isCorrect": true},
        {"label": "28", "orderIndex": 2, "isCorrect": false},
        {"label": "30", "orderIndex": 3, "isCorrect": false}
    ]
}
"@
    
    $q2 = Invoke-RestMethod -Uri "$baseUrl/questions/part/$($part1.id)" -Method Post -Body $q2Json -ContentType "application/json"
    Write-Host "  Question 2 created" -ForegroundColor Green
    
    # Create Question 3
    $q3Json = @"
{
    "questionType": "TRUE_FALSE",
    "prompt": "Sarah has two brothers.",
    "orderIndex": 2,
    "points": 2.0,
    "options": [
        {"label": "True", "orderIndex": 0, "isCorrect": false},
        {"label": "False", "orderIndex": 1, "isCorrect": true}
    ]
}
"@
    
    $q3 = Invoke-RestMethod -Uri "$baseUrl/questions/part/$($part1.id)" -Method Post -Body $q3Json -ContentType "application/json"
    Write-Host "  Question 3 created" -ForegroundColor Green
    
    # Publish the exam
    Write-Host "`nPublishing exam..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$baseUrl/exams/$($exam.id)/publish" -Method Put
    Write-Host "Exam published!" -ForegroundColor Green
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Created 1 working A1 exam with 3 questions" -ForegroundColor White
    Write-Host "You can now test taking this exam" -ForegroundColor White
    
} catch {
    Write-Host "`nError occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
