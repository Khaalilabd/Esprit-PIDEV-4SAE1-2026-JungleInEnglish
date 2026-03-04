# Test Exam Service API

$baseUrl = "http://localhost:8087/api"

Write-Host "=== Testing Exam Service API ===" -ForegroundColor Cyan

# Test 1: Create an Exam
Write-Host "`n1. Creating an A2 exam..." -ForegroundColor Yellow
$examData = @{
    title = "CEFR A2 English Test - Variant 1"
    level = "A2"
    description = "Elementary level English proficiency test"
    totalDuration = 90
    passingScore = 60.0
} | ConvertTo-Json

try {
    $exam = Invoke-RestMethod -Uri "$baseUrl/exams" -Method Post -Body $examData -ContentType "application/json"
    Write-Host "✓ Exam created successfully!" -ForegroundColor Green
    Write-Host "  Exam ID: $($exam.id)" -ForegroundColor Gray
    $examId = $exam.id
} catch {
    Write-Host "✗ Failed to create exam: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Get all exams
Write-Host "`n2. Getting all exams..." -ForegroundColor Yellow
try {
    $exams = Invoke-RestMethod -Uri "$baseUrl/exams" -Method Get
    Write-Host "✓ Retrieved $($exams.Count) exam(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get exams: $_" -ForegroundColor Red
}

# Test 3: Get exam by ID
Write-Host "`n3. Getting exam details..." -ForegroundColor Yellow
try {
    $examDetail = Invoke-RestMethod -Uri "$baseUrl/exams/$examId" -Method Get
    Write-Host "✓ Retrieved exam: $($examDetail.title)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get exam details: $_" -ForegroundColor Red
}

# Test 4: Create an exam part
Write-Host "`n4. Creating exam part (Grammar)..." -ForegroundColor Yellow
$partData = @{
    title = "Grammar Section"
    partType = "GRAMMAR"
    instructions = "Choose the correct answer for each question."
    orderIndex = 0
    timeLimit = 30
} | ConvertTo-Json

try {
    $part = Invoke-RestMethod -Uri "$baseUrl/exam-parts/exam/$examId" -Method Post -Body $partData -ContentType "application/json"
    Write-Host "✓ Part created successfully!" -ForegroundColor Green
    Write-Host "  Part ID: $($part.id)" -ForegroundColor Gray
    $partId = $part.id
} catch {
    Write-Host "✗ Failed to create part: $_" -ForegroundColor Red
}

# Test 5: Create a multiple choice question
Write-Host "`n5. Creating a multiple choice question..." -ForegroundColor Yellow
$questionData = @{
    questionType = "MULTIPLE_CHOICE"
    prompt = "What ___ you do yesterday?"
    orderIndex = 0
    points = 1.0
    explanation = "The correct answer is 'did' because we use 'did' for past simple questions."
    options = @(
        @{ label = "do"; orderIndex = 0; isCorrect = $false }
        @{ label = "did"; orderIndex = 1; isCorrect = $true }
        @{ label = "does"; orderIndex = 2; isCorrect = $false }
        @{ label = "doing"; orderIndex = 3; isCorrect = $false }
    )
    correctAnswer = @{
        answerData = @{ selectedOption = "did" } | ConvertTo-Json -Depth 10
    }
} | ConvertTo-Json -Depth 10

try {
    $question = Invoke-RestMethod -Uri "$baseUrl/questions/part/$partId" -Method Post -Body $questionData -ContentType "application/json"
    Write-Host "✓ Question created successfully!" -ForegroundColor Green
    Write-Host "  Question ID: $($question.id)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to create question: $_" -ForegroundColor Red
    Write-Host "Error details: $_" -ForegroundColor Red
}

# Test 6: Publish the exam
Write-Host "`n6. Publishing the exam..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/exams/$examId/publish" -Method Put
    Write-Host "✓ Exam published successfully!" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to publish exam: $_" -ForegroundColor Red
}

# Test 7: Get published exams
Write-Host "`n7. Getting published exams for level A2..." -ForegroundColor Yellow
try {
    $publishedUrl = "$baseUrl/exams/published?level=A2"
    $publishedExams = Invoke-RestMethod -Uri $publishedUrl -Method Get
    Write-Host "✓ Retrieved $($publishedExams.Count) published A2 exam(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get published exams: $_" -ForegroundColor Red
}

# Test 8: Start an exam attempt (as student userId=1)
Write-Host "`n8. Starting exam attempt for student..." -ForegroundColor Yellow
try {
    $attemptUrl = $baseUrl + '/exam-attempts/start?userId=1&level=A2'
    $attempt = Invoke-RestMethod -Uri $attemptUrl -Method Post
    Write-Host "✓ Exam attempt started!" -ForegroundColor Green
    Write-Host "  Attempt ID: $($attempt.id)" -ForegroundColor Gray
    $attemptId = $attempt.id
} catch {
    Write-Host "✗ Failed to start attempt: $_" -ForegroundColor Red
}

Write-Host "`n=== All tests completed! ===" -ForegroundColor Cyan
Write-Host "`nService is running successfully on port 8087" -ForegroundColor Green
