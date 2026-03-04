# Simplified CEFR Exams Seeding Script
# Creates 2 exams for each level using the exam builder UI format

$apiUrl = "http://localhost:8087"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Seeding CEFR Exam Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

function Create-SimpleExam {
    param(
        [string]$Title,
        [string]$Level,
        [string]$Description,
        [int]$Duration,
        [double]$PassingScore
    )
    
    Write-Host "`nCreating: $Title" -ForegroundColor Yellow
    
    $examJson = @"
{
    "title": "$Title",
    "level": "$Level",
    "description": "$Description",
    "totalDuration": $Duration,
    "passingScore": $PassingScore
}
"@
    
    try {
        $exam = Invoke-RestMethod -Uri "$apiUrl/exams" -Method Post -Body $examJson -ContentType "application/json"
        Write-Host "  Created exam ID: $($exam.id)" -ForegroundColor Green
        return $exam.id
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Create exams for all levels
$exams = @(
    @{ Title = "CEFR A1 English Proficiency Test - Basic Communication"; Level = "A1"; Description = "Beginner level test covering basic English communication skills"; Duration = 50; PassingScore = 60.0 }
    @{ Title = "CEFR A1 English Proficiency Test - Everyday Situations"; Level = "A1"; Description = "Beginner test focusing on common daily situations"; Duration = 50; PassingScore = 60.0 }
    
    @{ Title = "CEFR A2 English Proficiency Test - Personal Experiences"; Level = "A2"; Description = "Elementary test on personal information and past experiences"; Duration = 65; PassingScore = 65.0 }
    @{ Title = "CEFR A2 English Proficiency Test - Daily Routines"; Level = "A2"; Description = "Elementary test covering daily life and routines"; Duration = 65; PassingScore = 65.0 }
    
    @{ Title = "CEFR B1 English Proficiency Test - Work and Travel"; Level = "B1"; Description = "Intermediate test on professional and travel topics"; Duration = 85; PassingScore = 70.0 }
    @{ Title = "CEFR B1 English Proficiency Test - Technology"; Level = "B1"; Description = "Intermediate test on technology and communication"; Duration = 85; PassingScore = 70.0 }
    
    @{ Title = "CEFR B2 English Proficiency Test - Global Issues"; Level = "B2"; Description = "Upper intermediate test on global challenges"; Duration = 105; PassingScore = 75.0 }
    @{ Title = "CEFR B2 English Proficiency Test - Education"; Level = "B2"; Description = "Upper intermediate test on education and society"; Duration = 105; PassingScore = 75.0 }
    
    @{ Title = "CEFR C1 English Proficiency Test - Academic Contexts"; Level = "C1"; Description = "Advanced test for academic and professional settings"; Duration = 130; PassingScore = 80.0 }
    @{ Title = "CEFR C1 English Proficiency Test - Critical Analysis"; Level = "C1"; Description = "Advanced test requiring critical analytical skills"; Duration = 130; PassingScore = 80.0 }
    
    @{ Title = "CEFR C2 English Proficiency Test - Mastery"; Level = "C2"; Description = "Proficiency test demonstrating near-native mastery"; Duration = 150; PassingScore = 85.0 }
    @{ Title = "CEFR C2 English Proficiency Test - Expert Level"; Level = "C2"; Description = "Expert-level proficiency test"; Duration = 150; PassingScore = 85.0 }
)

$createdCount = 0
foreach ($examData in $exams) {
    $examId = Create-SimpleExam -Title $examData.Title -Level $examData.Level `
        -Description $examData.Description -Duration $examData.Duration `
        -PassingScore $examData.PassingScore
    
    if ($examId) {
        $createdCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Successfully created $createdCount out of $($exams.Count) exams" -ForegroundColor $(if ($createdCount -eq $exams.Count) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "Note: Exams have been created but need questions added via the Exam Builder UI" -ForegroundColor Yellow
Write-Host "Navigate to: http://localhost:4200/dashboard/exam-management" -ForegroundColor Cyan
Write-Host ""
