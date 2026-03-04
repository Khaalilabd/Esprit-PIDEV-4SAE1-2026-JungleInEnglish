# Complete CEFR Exams Seeding Script
# Creates 2 exams for each CEFR level (A1, A2, B1, B2, C1, C2)
# Total: 12 comprehensive exams

$apiUrl = "http://localhost:8087"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Seeding Complete CEFR Exam Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to create exam with parts and questions
function Create-Exam {
    param (
        [string]$Title,
        [string]$Level,
        [string]$Description,
        [int]$Duration,
        [double]$PassingScore,
        [array]$Parts
    )
    
    Write-Host "Creating: $Title" -ForegroundColor Yellow
    
    # Create exam
    $examData = @{
        title = $Title
        level = $Level
        description = $Description
        totalDuration = $Duration
        passingScore = $PassingScore
        isPublished = $true
    } | ConvertTo-Json
    
    try {
        $exam = Invoke-RestMethod -Uri "$apiUrl/exams" -Method Post -Body $examData -ContentType "application/json"
        Write-Host "  Exam created: $($exam.id)" -ForegroundColor Green
        
        # Create parts
        foreach ($partData in $Parts) {
            $part = @{
                title = $partData.title
                partType = $partData.partType
                instructions = $partData.instructions
                orderIndex = $partData.orderIndex
                duration = $partData.duration
            } | ConvertTo-Json
            
            $createdPart = Invoke-RestMethod -Uri "$apiUrl/exam-parts/exam/$($exam.id)" -Method Post -Body $part -ContentType "application/json"
            Write-Host "    Part created: $($createdPart.title)" -ForegroundColor Cyan
            
            # Create questions
            foreach ($questionData in $partData.questions) {
                $question = @{
                    questionType = $questionData.questionType
                    prompt = $questionData.prompt
                    mediaUrl = $questionData.mediaUrl
                    orderIndex = $questionData.orderIndex
                    points = $questionData.points
                    explanation = $questionData.explanation
                    metadata = $questionData.metadata
                    options = $questionData.options
                } | ConvertTo-Json -Depth 5
                
                $createdQuestion = Invoke-RestMethod -Uri "$apiUrl/questions/part/$($createdPart.id)" -Method Post -Body $question -ContentType "application/json"
            }
        }
        
        Write-Host "  Complete!" -ForegroundColor Green
        Write-Host ""
        
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============================================
# A1 LEVEL EXAMS (Beginner)
# ============================================

Write-Host "`n=== A1 LEVEL EXAMS ===" -ForegroundColor Magenta

# A1 Exam 1: Basic Communication
$a1Exam1Parts = @(
    @{
        title = "Reading Comprehension"
        partType = "READING"
        instructions = "Read the text and answer the questions."
        orderIndex = 0
        duration = 15
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Hello! My name is Tom. I am 20 years old. I live in London. I am a student. What is Tom's job?"
                orderIndex = 0
                points = 2.0
                explanation = "The text says 'I am a student'"
                metadata = @{}
                options = @(
                    @{ label = "Teacher"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Student"; orderIndex = 1; isCorrect = $true }
                    @{ label = "Doctor"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Engineer"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "Tom lives in Paris."
                orderIndex = 1
                points = 1.0
                explanation = "Tom lives in London, not Paris"
                metadata = @{}
                options = @(
                    @{ label = "True"; orderIndex = 0; isCorrect = $false }
                    @{ label = "False"; orderIndex = 1; isCorrect = $true }
                )
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "How old is Tom?"
                orderIndex = 2
                points = 1.0
                explanation = "The text says 'I am 20 years old'"
                metadata = @{}
                options = @(
                    @{ label = "18 years old"; orderIndex = 0; isCorrect = $false }
                    @{ label = "20 years old"; orderIndex = 1; isCorrect = $true }
                    @{ label = "22 years old"; orderIndex = 2; isCorrect = $false }
                    @{ label = "25 years old"; orderIndex = 3; isCorrect = $false }
                )
            }
        )
    }
    @{
        title = "Grammar and Vocabulary"
        partType = "GRAMMAR"
        instructions = "Complete the sentences with the correct word."
        orderIndex = 1
        duration = 20
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "I ___ a teacher."
                orderIndex = 0
                points = 1.0
                explanation = "Use 'am' with 'I'"
                metadata = @{}
                options = @(
                    @{ label = "am"; orderIndex = 0; isCorrect = $true }
                    @{ label = "is"; orderIndex = 1; isCorrect = $false }
                    @{ label = "are"; orderIndex = 2; isCorrect = $false }
                    @{ label = "be"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "She ___ to work every day. (go)"
                orderIndex = 1
                points = 1.5
                explanation = "Third person singular present simple takes 's'"
                metadata = @{ correctAnswer = "goes" }
                options = @()
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "There ___ two cats in the garden."
                orderIndex = 2
                points = 1.0
                explanation = "Use 'are' with plural nouns"
                metadata = @{}
                options = @(
                    @{ label = "is"; orderIndex = 0; isCorrect = $false }
                    @{ label = "are"; orderIndex = 1; isCorrect = $true }
                    @{ label = "am"; orderIndex = 2; isCorrect = $false }
                    @{ label = "be"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "WORD_ORDERING"
                prompt = "Put the words in order: you / are / How / ?"
                orderIndex = 3
                points = 2.0
                explanation = "Question word order: How + are + you + ?"
                metadata = @{ correctAnswer = "How are you ?" }
                options = @()
            }
        )
    }
    @{
        title = "Writing"
        partType = "WRITING"
        instructions = "Write a short text about yourself."
        orderIndex = 2
        duration = 15
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Write 3-4 sentences about yourself. Include: your name, age, where you live, and what you do."
                orderIndex = 0
                points = 10.0
                explanation = "Check for: basic personal information, simple present tense, basic vocabulary"
                metadata = @{}
                options = @()
            }
        )
    }
)

Create-Exam -Title "CEFR A1 English Test - Part 1" -Level "A1" `
    -Description "Basic English proficiency test for beginners" `
    -Duration 50 -PassingScore 60.0 -Parts $a1Exam1Parts

# A1 Exam 2: Everyday Situations
$a1Exam2Parts = @(
    @{
        title = "Reading Comprehension"
        partType = "READING"
        instructions = "Read and answer the questions."
        orderIndex = 0
        duration = 15
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "The shop opens at 9:00 AM and closes at 6:00 PM. When does the shop close?"
                orderIndex = 0
                points = 2.0
                explanation = "The text says 'closes at 6:00 PM'"
                metadata = @{}
                options = @(
                    @{ label = "9:00 AM"; orderIndex = 0; isCorrect = $false }
                    @{ label = "12:00 PM"; orderIndex = 1; isCorrect = $false }
                    @{ label = "6:00 PM"; orderIndex = 2; isCorrect = $true }
                    @{ label = "8:00 PM"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "The shop is open in the morning."
                orderIndex = 1
                points = 1.0
                explanation = "It opens at 9:00 AM, which is morning"
                metadata = @{}
                options = @(
                    @{ label = "True"; orderIndex = 0; isCorrect = $true }
                    @{ label = "False"; orderIndex = 1; isCorrect = $false }
                )
            }
        )
    }
    @{
        title = "Vocabulary"
        partType = "VOCABULARY"
        instructions = "Choose the correct word."
        orderIndex = 1
        duration = 15
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "I drink ___ in the morning."
                orderIndex = 0
                points = 1.0
                explanation = "Coffee is a common morning drink"
                metadata = @{}
                options = @(
                    @{ label = "coffee"; orderIndex = 0; isCorrect = $true }
                    @{ label = "dinner"; orderIndex = 1; isCorrect = $false }
                    @{ label = "lunch"; orderIndex = 2; isCorrect = $false }
                    @{ label = "breakfast"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "My ___ is John. (name)"
                orderIndex = 1
                points = 1.0
                explanation = "Use 'name' to introduce yourself"
                metadata = @{ correctAnswer = "name" }
                options = @()
            }
        )
    }
    @{
        title = "Writing"
        partType = "WRITING"
        instructions = "Write about your daily routine."
        orderIndex = 2
        duration = 20
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Write 4-5 sentences about your daily routine. What time do you wake up? What do you do in the morning?"
                orderIndex = 0
                points = 10.0
                explanation = "Check for: time expressions, daily activities, present simple tense"
                metadata = @{}
                options = @()
            }
        )
    }
)

Create-Exam -Title "CEFR A1 English Test - Part 2" -Level "A1" `
    -Description "Basic English test focusing on everyday situations" `
    -Duration 50 -PassingScore 60.0 -Parts $a1Exam2Parts

Write-Host "A1 exams created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Seeding Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ============================================
# A2 LEVEL EXAMS (Elementary)
# ============================================

Write-Host "`n=== A2 LEVEL EXAMS ===" -ForegroundColor Magenta

# A2 Exam 1: Personal Information and Experiences
$a2Exam1Parts = @(
    @{
        title = "Reading Comprehension"
        partType = "READING"
        instructions = "Read the email and answer the questions."
        orderIndex = 0
        duration = 20
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Dear Sarah, Last weekend I went to the beach with my family. The weather was sunny and warm. We swam in the sea and played volleyball. In the evening, we had a barbecue. It was a great day! Best wishes, Mike. What did Mike do last weekend?"
                orderIndex = 0
                points = 2.0
                explanation = "Mike went to the beach with his family"
                metadata = @{}
                options = @(
                    @{ label = "Went to the mountains"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Went to the beach"; orderIndex = 1; isCorrect = $true }
                    @{ label = "Stayed at home"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Went shopping"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "The weather was cold and rainy."
                orderIndex = 1
                points = 1.0
                explanation = "The text says 'sunny and warm'"
                metadata = @{}
                options = @(
                    @{ label = "True"; orderIndex = 0; isCorrect = $false }
                    @{ label = "False"; orderIndex = 1; isCorrect = $true }
                )
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "What did they do in the evening?"
                orderIndex = 2
                points = 2.0
                explanation = "They had a barbecue in the evening"
                metadata = @{}
                options = @(
                    @{ label = "Went to a restaurant"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Had a barbecue"; orderIndex = 1; isCorrect = $true }
                    @{ label = "Watched a movie"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Went to bed early"; orderIndex = 3; isCorrect = $false }
                )
            }
        )
    }
    @{
        title = "Grammar and Vocabulary"
        partType = "GRAMMAR"
        instructions = "Complete the sentences correctly."
        orderIndex = 1
        duration = 25
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "I ___ to Paris last year."
                orderIndex = 0
                points = 1.5
                explanation = "Use past simple 'went' for completed past actions"
                metadata = @{}
                options = @(
                    @{ label = "go"; orderIndex = 0; isCorrect = $false }
                    @{ label = "went"; orderIndex = 1; isCorrect = $true }
                    @{ label = "going"; orderIndex = 2; isCorrect = $false }
                    @{ label = "goes"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "She is ___ than her sister. (tall)"
                orderIndex = 1
                points = 2.0
                explanation = "Comparative form of tall"
                metadata = @{ correctAnswer = "taller" }
                options = @()
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "There isn't ___ milk in the fridge."
                orderIndex = 2
                points = 1.5
                explanation = "Use 'any' in negative sentences"
                metadata = @{}
                options = @(
                    @{ label = "some"; orderIndex = 0; isCorrect = $false }
                    @{ label = "any"; orderIndex = 1; isCorrect = $true }
                    @{ label = "many"; orderIndex = 2; isCorrect = $false }
                    @{ label = "much"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "WORD_ORDERING"
                prompt = "Put the words in order: often / do / How / exercise / you / ?"
                orderIndex = 3
                points = 2.0
                explanation = "Adverb of frequency question structure"
                metadata = @{ correctAnswer = "How often do you exercise ?" }
                options = @()
            }
        )
    }
    @{
        title = "Writing"
        partType = "WRITING"
        instructions = "Write about a past experience."
        orderIndex = 2
        duration = 20
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Write about your last holiday. Where did you go? What did you do? Did you enjoy it? (Write 50-60 words)"
                orderIndex = 0
                points = 15.0
                explanation = "Check for: past simple tense, time expressions, descriptive vocabulary, coherence"
                metadata = @{}
                options = @()
            }
        )
    }
)

Create-Exam -Title "CEFR A2 English Test - Part 1" -Level "A2" `
    -Description "Elementary English test focusing on personal experiences" `
    -Duration 65 -PassingScore 65.0 -Parts $a2Exam1Parts

# A2 Exam 2: Daily Life and Routines
$a2Exam2Parts = @(
    @{
        title = "Reading Comprehension"
        partType = "READING"
        instructions = "Read the text about daily routines."
        orderIndex = 0
        duration = 20
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Emma wakes up at 7:00 AM every day. She has breakfast at 7:30 and leaves for work at 8:15. She works in an office from 9:00 AM to 5:00 PM. After work, she goes to the gym. What time does Emma leave for work?"
                orderIndex = 0
                points = 2.0
                explanation = "Emma leaves for work at 8:15"
                metadata = @{}
                options = @(
                    @{ label = "7:00 AM"; orderIndex = 0; isCorrect = $false }
                    @{ label = "7:30 AM"; orderIndex = 1; isCorrect = $false }
                    @{ label = "8:15 AM"; orderIndex = 2; isCorrect = $true }
                    @{ label = "9:00 AM"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "Emma works in a school."
                orderIndex = 1
                points = 1.0
                explanation = "She works in an office, not a school"
                metadata = @{}
                options = @(
                    @{ label = "True"; orderIndex = 0; isCorrect = $false }
                    @{ label = "False"; orderIndex = 1; isCorrect = $true }
                )
            }
        )
    }
    @{
        title = "Grammar"
        partType = "GRAMMAR"
        instructions = "Choose the correct answer."
        orderIndex = 1
        duration = 20
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "I ___ watching TV now."
                orderIndex = 0
                points = 1.5
                explanation = "Present continuous for actions happening now"
                metadata = @{}
                options = @(
                    @{ label = "am"; orderIndex = 0; isCorrect = $true }
                    @{ label = "is"; orderIndex = 1; isCorrect = $false }
                    @{ label = "are"; orderIndex = 2; isCorrect = $false }
                    @{ label = "be"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "He ___ play football when he was young. (can)"
                orderIndex = 1
                points = 2.0
                explanation = "Past form of 'can' is 'could'"
                metadata = @{ correctAnswer = "could" }
                options = @()
            }
        )
    }
    @{
        title = "Writing"
        partType = "WRITING"
        instructions = "Describe your typical day."
        orderIndex = 2
        duration = 25
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Describe your typical weekday. What time do you wake up? What do you do during the day? (Write 60-70 words)"
                orderIndex = 0
                points = 15.0
                explanation = "Check for: present simple for routines, time expressions, sequencing words"
                metadata = @{}
                options = @()
            }
        )
    }
)

Create-Exam -Title "CEFR A2 English Test - Part 2" -Level "A2" `
    -Description "Elementary English test on daily life and routines" `
    -Duration 65 -PassingScore 65.0 -Parts $a2Exam2Parts

Write-Host "A2 exams created successfully!" -ForegroundColor Green

# ============================================
# B1 LEVEL EXAMS (Intermediate)
# ============================================

Write-Host "`n=== B1 LEVEL EXAMS ===" -ForegroundColor Magenta

# B1 Exam 1: Work and Travel
$b1Exam1Parts = @(
    @{
        title = "Reading Comprehension"
        partType = "READING"
        instructions = "Read the article and answer the questions."
        orderIndex = 0
        duration = 25
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Remote work has become increasingly popular in recent years. Many companies now allow their employees to work from home at least part of the time. This flexibility can lead to better work-life balance and increased productivity. However, some people find it challenging to separate work and personal life when working from home. What is mentioned as a benefit of remote work?"
                orderIndex = 0
                points = 2.5
                explanation = "Better work-life balance is mentioned as a benefit"
                metadata = @{}
                options = @(
                    @{ label = "Higher salary"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Better work-life balance"; orderIndex = 1; isCorrect = $true }
                    @{ label = "More vacation days"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Free meals"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "Everyone finds it easy to work from home."
                orderIndex = 1
                points = 1.5
                explanation = "Some people find it challenging"
                metadata = @{}
                options = @(
                    @{ label = "True"; orderIndex = 0; isCorrect = $false }
                    @{ label = "False"; orderIndex = 1; isCorrect = $true }
                )
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "According to the text, what challenge do some people face?"
                orderIndex = 2
                points = 2.5
                explanation = "Separating work and personal life is mentioned as a challenge"
                metadata = @{}
                options = @(
                    @{ label = "Finding a job"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Separating work and personal life"; orderIndex = 1; isCorrect = $true }
                    @{ label = "Using technology"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Commuting to work"; orderIndex = 3; isCorrect = $false }
                )
            }
        )
    }
    @{
        title = "Grammar and Vocabulary"
        partType = "GRAMMAR"
        instructions = "Complete the sentences with the correct form."
        orderIndex = 1
        duration = 30
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "If I ___ more money, I would travel around the world."
                orderIndex = 0
                points = 2.0
                explanation = "Second conditional uses past simple in if-clause"
                metadata = @{}
                options = @(
                    @{ label = "have"; orderIndex = 0; isCorrect = $false }
                    @{ label = "had"; orderIndex = 1; isCorrect = $true }
                    @{ label = "will have"; orderIndex = 2; isCorrect = $false }
                    @{ label = "would have"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "She has been ___ for this company since 2020. (work)"
                orderIndex = 1
                points = 2.5
                explanation = "Present perfect continuous with 'since'"
                metadata = @{ correctAnswer = "working" }
                options = @()
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "The report ___ by the manager yesterday."
                orderIndex = 2
                points = 2.0
                explanation = "Passive voice in past simple"
                metadata = @{}
                options = @(
                    @{ label = "writes"; orderIndex = 0; isCorrect = $false }
                    @{ label = "wrote"; orderIndex = 1; isCorrect = $false }
                    @{ label = "was written"; orderIndex = 2; isCorrect = $true }
                    @{ label = "is written"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "WORD_ORDERING"
                prompt = "Put the words in order: been / you / have / How / learning / long / English / ?"
                orderIndex = 3
                points = 3.0
                explanation = "Present perfect continuous question"
                metadata = @{ correctAnswer = "How long have you been learning English ?" }
                options = @()
            }
        )
    }
    @{
        title = "Writing"
        partType = "WRITING"
        instructions = "Write an opinion essay."
        orderIndex = 2
        duration = 30
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Write your opinion about working from home. Do you think it's better than working in an office? Give reasons and examples. (Write 100-120 words)"
                orderIndex = 0
                points = 20.0
                explanation = "Check for: clear opinion, supporting arguments, examples, linking words, appropriate vocabulary, grammar accuracy"
                metadata = @{}
                options = @()
            }
        )
    }
)

Create-Exam -Title "CEFR B1 English Test - Part 1" -Level "B1" `
    -Description = "Intermediate English test on work and travel topics" `
    -Duration 85 -PassingScore 70.0 -Parts $b1Exam1Parts

# B1 Exam 2: Technology and Communication
$b1Exam2Parts = @(
    @{
        title = "Reading Comprehension"
        partType = "READING"
        instructions = "Read about social media and answer."
        orderIndex = 0
        duration = 25
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Social media platforms have revolutionized the way we communicate. While they allow us to stay connected with friends and family across the globe, they also raise concerns about privacy and mental health. Studies suggest that excessive social media use can lead to anxiety and depression, particularly among young people. What is one concern mentioned about social media?"
                orderIndex = 0
                points = 2.5
                explanation = "Privacy and mental health are mentioned as concerns"
                metadata = @{}
                options = @(
                    @{ label = "It's too expensive"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Privacy concerns"; orderIndex = 1; isCorrect = $true }
                    @{ label = "It's difficult to use"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Limited access"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "Social media helps people stay connected globally."
                orderIndex = 1
                points = 1.5
                explanation = "The text mentions staying connected across the globe"
                metadata = @{}
                options = @(
                    @{ label = "True"; orderIndex = 0; isCorrect = $true }
                    @{ label = "False"; orderIndex = 1; isCorrect = $false }
                )
            }
        )
    }
    @{
        title = "Grammar"
        partType = "GRAMMAR"
        instructions = "Choose the correct option."
        orderIndex = 1
        duration = 25
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "I wish I ___ speak more languages."
                orderIndex = 0
                points = 2.0
                explanation = "Wish + past simple for present wishes"
                metadata = @{}
                options = @(
                    @{ label = "can"; orderIndex = 0; isCorrect = $false }
                    @{ label = "could"; orderIndex = 1; isCorrect = $true }
                    @{ label = "will"; orderIndex = 2; isCorrect = $false }
                    @{ label = "would"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "By next year, I ___ here for five years. (live)"
                orderIndex = 1
                points = 2.5
                explanation = "Future perfect: will have lived"
                metadata = @{ correctAnswer = "will have lived" }
                options = @()
            }
        )
    }
    @{
        title = "Writing"
        partType = "WRITING"
        instructions = "Write about technology in your life."
        orderIndex = 2
        duration = 35
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "How has technology changed your daily life? Discuss both positive and negative aspects. (Write 120-140 words)"
                orderIndex = 0
                points = 20.0
                explanation = "Check for: balanced argument, specific examples, appropriate vocabulary, complex sentences, coherence"
                metadata = @{}
                options = @()
            }
        )
    }
)

Create-Exam -Title "CEFR B1 English Test - Part 2" -Level "B1" `
    -Description "Intermediate test on technology and communication" `
    -Duration 85 -PassingScore 70.0 -Parts $b1Exam2Parts

Write-Host "B1 exams created successfully!" -ForegroundColor Green

# ============================================
# B2 LEVEL EXAMS (Upper Intermediate)
# ============================================

Write-Host "`n=== B2 LEVEL EXAMS ===" -ForegroundColor Magenta

# B2 Exam 1: Global Issues
$b2Exam1Parts = @(
    @{
        title = "Reading Comprehension"
        partType = "READING"
        instructions = "Read the article about climate change."
        orderIndex = 0
        duration = 30
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Climate change represents one of the most pressing challenges of our time. Scientists have warned that without immediate action, global temperatures could rise by more than 2 degrees Celsius by the end of the century, leading to catastrophic consequences. Governments worldwide are implementing policies to reduce carbon emissions, though critics argue that these measures are insufficient. What do scientists warn about?"
                orderIndex = 0
                points = 3.0
                explanation = "Scientists warn about temperature rise and catastrophic consequences"
                metadata = @{}
                options = @(
                    @{ label = "Economic recession"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Temperature rise above 2 degrees"; orderIndex = 1; isCorrect = $true }
                    @{ label = "Population decline"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Technology failure"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "All critics believe government policies are sufficient."
                orderIndex = 1
                points = 2.0
                explanation = "Critics argue measures are insufficient"
                metadata = @{}
                options = @(
                    @{ label = "True"; orderIndex = 0; isCorrect = $false }
                    @{ label = "False"; orderIndex = 1; isCorrect = $true }
                )
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "What are governments doing according to the text?"
                orderIndex = 2
                points = 3.0
                explanation = "Implementing policies to reduce carbon emissions"
                metadata = @{}
                options = @(
                    @{ label = "Ignoring the problem"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Implementing emission reduction policies"; orderIndex = 1; isCorrect = $true }
                    @{ label = "Increasing industrial production"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Banning all vehicles"; orderIndex = 3; isCorrect = $false }
                )
            }
        )
    }
    @{
        title = "Grammar and Vocabulary"
        partType = "GRAMMAR"
        instructions = "Demonstrate advanced grammar knowledge."
        orderIndex = 1
        duration = 35
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Had I known about the meeting, I ___ attended."
                orderIndex = 0
                points = 2.5
                explanation = "Third conditional with inversion"
                metadata = @{}
                options = @(
                    @{ label = "will have"; orderIndex = 0; isCorrect = $false }
                    @{ label = "would have"; orderIndex = 1; isCorrect = $true }
                    @{ label = "would"; orderIndex = 2; isCorrect = $false }
                    @{ label = "had"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "The project, ___ was completed last month, exceeded all expectations. (which/that)"
                orderIndex = 1
                points = 3.0
                explanation = "Non-defining relative clause requires 'which'"
                metadata = @{ correctAnswer = "which" }
                options = @()
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "She is said ___ the best candidate for the position."
                orderIndex = 2
                points = 2.5
                explanation = "Passive reporting structure with 'to be'"
                metadata = @{}
                options = @(
                    @{ label = "being"; orderIndex = 0; isCorrect = $false }
                    @{ label = "to be"; orderIndex = 1; isCorrect = $true }
                    @{ label = "be"; orderIndex = 2; isCorrect = $false }
                    @{ label = "been"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "WORD_ORDERING"
                prompt = "Rearrange: circumstances / under / would / no / I / that / accept / offer"
                orderIndex = 3
                points = 3.5
                explanation = "Emphatic structure with negative inversion"
                metadata = @{ correctAnswer = "Under no circumstances would I accept that offer" }
                options = @()
            }
        )
    }
    @{
        title = "Writing"
        partType = "WRITING"
        instructions = "Write an argumentative essay."
        orderIndex = 2
        duration = 40
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Should governments prioritize economic growth or environmental protection? Present a well-reasoned argument with specific examples. (Write 200-220 words)"
                orderIndex = 0
                points = 25.0
                explanation = "Check for: clear thesis, logical argumentation, counterarguments, sophisticated vocabulary, complex grammar structures, cohesion"
                metadata = @{}
                options = @()
            }
        )
    }
)

Create-Exam -Title "CEFR B2 English Test - Part 1" -Level "B2" `
    -Description "Upper intermediate test on global issues" `
    -Duration 105 -PassingScore 75.0 -Parts $b2Exam1Parts

# B2 Exam 2: Education and Society
$b2Exam2Parts = @(
    @{
        title = "Reading Comprehension"
        partType = "READING"
        instructions = "Read about modern education systems."
        orderIndex = 0
        duration = 30
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Traditional education systems are being challenged by innovative approaches that emphasize critical thinking and creativity over rote memorization. Proponents of these methods argue that students need skills that prepare them for an unpredictable future, while traditionalists maintain that foundational knowledge remains essential. The debate continues as educators seek the optimal balance. What do innovative approaches emphasize?"
                orderIndex = 0
                points = 3.0
                explanation = "Critical thinking and creativity are emphasized"
                metadata = @{}
                options = @(
                    @{ label = "Rote memorization"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Critical thinking and creativity"; orderIndex = 1; isCorrect = $true }
                    @{ label = "Standardized testing"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Traditional methods"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "Everyone agrees on the best educational approach."
                orderIndex = 1
                points = 2.0
                explanation = "There is debate between different approaches"
                metadata = @{}
                options = @(
                    @{ label = "True"; orderIndex = 0; isCorrect = $false }
                    @{ label = "False"; orderIndex = 1; isCorrect = $true }
                )
            }
        )
    }
    @{
        title = "Grammar"
        partType = "GRAMMAR"
        instructions = "Complete with appropriate forms."
        orderIndex = 1
        duration = 30
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Scarcely ___ the presentation when questions began."
                orderIndex = 0
                points = 2.5
                explanation = "Negative adverb inversion with past perfect"
                metadata = @{}
                options = @(
                    @{ label = "I finished"; orderIndex = 0; isCorrect = $false }
                    @{ label = "had I finished"; orderIndex = 1; isCorrect = $true }
                    @{ label = "I had finished"; orderIndex = 2; isCorrect = $false }
                    @{ label = "did I finish"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "The committee recommended that the proposal ___ immediately. (implement)"
                orderIndex = 1
                points = 3.0
                explanation = "Subjunctive mood after 'recommend'"
                metadata = @{ correctAnswer = "be implemented" }
                options = @()
            }
        )
    }
    @{
        title = "Writing"
        partType = "WRITING"
        instructions = "Write a formal report."
        orderIndex = 2
        duration = 45
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Write a report analyzing the advantages and disadvantages of online education compared to traditional classroom learning. Include recommendations. (Write 220-240 words)"
                orderIndex = 0
                points = 25.0
                explanation = "Check for: formal register, clear structure, objective analysis, evidence-based arguments, appropriate recommendations"
                metadata = @{}
                options = @()
            }
        )
    }
)

Create-Exam -Title "CEFR B2 English Test - Part 2" -Level "B2" `
    -Description "Upper intermediate test on education and society" `
    -Duration 105 -PassingScore 75.0 -Parts $b2Exam2Parts

Write-Host "B2 exams created successfully!" -ForegroundColor Green

# ============================================
# C1 LEVEL EXAMS (Advanced)
# ============================================

Write-Host "`n=== C1 LEVEL EXAMS ===" -ForegroundColor Magenta

# C1 Exam 1: Academic and Professional Contexts
$c1Exam1Parts = @(
    @{
        title = "Reading Comprehension"
        partType = "READING"
        instructions = "Analyze the complex academic text."
        orderIndex = 0
        duration = 40
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "The paradigm shift in contemporary neuroscience has fundamentally altered our understanding of cognitive processes. Neuroplasticity, once considered a phenomenon limited to developmental stages, is now recognized as a lifelong capacity. This revelation has profound implications for educational methodologies, rehabilitation protocols, and our conceptualization of human potential. What has changed in neuroscience understanding?"
                orderIndex = 0
                points = 4.0
                explanation = "Understanding of neuroplasticity as a lifelong capacity"
                metadata = @{}
                options = @(
                    @{ label = "Brain size increases with age"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Neuroplasticity is lifelong, not just developmental"; orderIndex = 1; isCorrect = $true }
                    @{ label = "Cognitive processes are fixed"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Education has no effect on the brain"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "Neuroplasticity was always understood to be a lifelong phenomenon."
                orderIndex = 1
                points = 2.5
                explanation = "It was once considered limited to developmental stages"
                metadata = @{}
                options = @(
                    @{ label = "True"; orderIndex = 0; isCorrect = $false }
                    @{ label = "False"; orderIndex = 1; isCorrect = $true }
                )
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "According to the text, what areas are affected by this discovery?"
                orderIndex = 2
                points = 4.0
                explanation = "Educational methodologies, rehabilitation, and conceptualization of human potential"
                metadata = @{}
                options = @(
                    @{ label = "Only medical treatments"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Education, rehabilitation, and human potential concepts"; orderIndex = 1; isCorrect = $true }
                    @{ label = "Only psychological therapy"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Only academic research"; orderIndex = 3; isCorrect = $false }
                )
            }
        )
    }
    @{
        title = "Advanced Grammar and Vocabulary"
        partType = "GRAMMAR"
        instructions = "Demonstrate mastery of complex structures."
        orderIndex = 1
        duration = 40
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Not only ___ the proposal rejected, but the entire committee resigned."
                orderIndex = 0
                points = 3.5
                explanation = "Correlative conjunction with inversion"
                metadata = @{}
                options = @(
                    @{ label = "was"; orderIndex = 0; isCorrect = $true }
                    @{ label = "were"; orderIndex = 1; isCorrect = $false }
                    @{ label = "has been"; orderIndex = 2; isCorrect = $false }
                    @{ label = "had been"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "The research, ___ findings were published last month, challenges conventional wisdom. (whose/which)"
                orderIndex = 1
                points = 3.5
                explanation = "Possessive relative pronoun 'whose'"
                metadata = @{ correctAnswer = "whose" }
                options = @()
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "The phenomenon ___ for decades before scientists understood its significance."
                orderIndex = 2
                points = 3.5
                explanation = "Past perfect continuous for extended past action"
                metadata = @{}
                options = @(
                    @{ label = "was occurring"; orderIndex = 0; isCorrect = $false }
                    @{ label = "had been occurring"; orderIndex = 1; isCorrect = $true }
                    @{ label = "has been occurring"; orderIndex = 2; isCorrect = $false }
                    @{ label = "occurred"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "WORD_ORDERING"
                prompt = "Rearrange: circumstances / such / under / would / never / I / compromise / my / principles"
                orderIndex = 3
                points = 4.0
                explanation = "Complex emphatic structure"
                metadata = @{ correctAnswer = "Under such circumstances would I never compromise my principles" }
                options = @()
            }
        )
    }
    @{
        title = "Academic Writing"
        partType = "WRITING"
        instructions = "Produce sophisticated academic discourse."
        orderIndex = 2
        duration = 50
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Critically evaluate the assertion that technological advancement inevitably leads to social progress. Support your argument with specific examples and consider counterarguments. (Write 280-300 words)"
                orderIndex = 0
                points = 30.0
                explanation = "Check for: sophisticated argumentation, nuanced analysis, academic register, complex syntax, precise vocabulary, logical coherence, critical thinking"
                metadata = @{}
                options = @()
            }
        )
    }
)

Create-Exam -Title "CEFR C1 English Test - Part 1" -Level "C1" `
    -Description "Advanced test for academic and professional contexts" `
    -Duration 130 -PassingScore 80.0 -Parts $c1Exam1Parts

# C1 Exam 2: Critical Analysis and Discourse
$c1Exam2Parts = @(
    @{
        title = "Reading Comprehension"
        partType = "READING"
        instructions = "Analyze complex argumentative text."
        orderIndex = 0
        duration = 40
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "The dichotomy between individual liberty and collective responsibility has long perplexed political philosophers. While libertarian perspectives prioritize personal autonomy, communitarian approaches emphasize social cohesion. Contemporary discourse suggests that this binary opposition may be a false dichotomy, with optimal governance requiring a nuanced synthesis of both principles. What does contemporary discourse suggest?"
                orderIndex = 0
                points = 4.0
                explanation = "The opposition may be false; synthesis is needed"
                metadata = @{}
                options = @(
                    @{ label = "Individual liberty should always prevail"; orderIndex = 0; isCorrect = $false }
                    @{ label = "The opposition may be false; synthesis is needed"; orderIndex = 1; isCorrect = $true }
                    @{ label = "Collective responsibility is more important"; orderIndex = 2; isCorrect = $false }
                    @{ label = "The dichotomy is insurmountable"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "Libertarian and communitarian approaches are completely compatible."
                orderIndex = 1
                points = 2.5
                explanation = "They have different priorities, though synthesis is possible"
                metadata = @{}
                options = @(
                    @{ label = "True"; orderIndex = 0; isCorrect = $false }
                    @{ label = "False"; orderIndex = 1; isCorrect = $true }
                )
            }
        )
    }
    @{
        title = "Advanced Language Use"
        partType = "GRAMMAR"
        instructions = "Demonstrate sophisticated language control."
        orderIndex = 1
        duration = 40
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Little ___ that their decision would have such far-reaching consequences."
                orderIndex = 0
                points = 3.5
                explanation = "Negative inversion with past auxiliary"
                metadata = @{}
                options = @(
                    @{ label = "they realized"; orderIndex = 0; isCorrect = $false }
                    @{ label = "did they realize"; orderIndex = 1; isCorrect = $true }
                    @{ label = "they did realize"; orderIndex = 2; isCorrect = $false }
                    @{ label = "had they realized"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "The theory, ___ validity remains contested, continues to influence research. (whose/which)"
                orderIndex = 1
                points = 3.5
                explanation = "Possessive relative clause"
                metadata = @{ correctAnswer = "whose" }
                options = @()
            }
        )
    }
    @{
        title = "Analytical Writing"
        partType = "WRITING"
        instructions = "Produce critical analytical discourse."
        orderIndex = 2
        duration = 50
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Analyze the extent to which globalization has eroded cultural identity. Consider economic, social, and technological dimensions in your response. (Write 300-320 words)"
                orderIndex = 0
                points = 30.0
                explanation = "Check for: multi-dimensional analysis, sophisticated argumentation, academic precision, complex structures, critical evaluation"
                metadata = @{}
                options = @()
            }
        )
    }
)

Create-Exam -Title "CEFR C1 English Test - Part 2" -Level "C1" `
    -Description "Advanced test for critical analysis and discourse" `
    -Duration 130 -PassingScore 80.0 -Parts $c1Exam2Parts

Write-Host "C1 exams created successfully!" -ForegroundColor Green

# ============================================
# C2 LEVEL EXAMS (Proficiency/Mastery)
# ============================================

Write-Host "`n=== C2 LEVEL EXAMS ===" -ForegroundColor Magenta

# C2 Exam 1: Mastery of Complex Discourse
$c2Exam1Parts = @(
    @{
        title = "Reading Comprehension"
        partType = "READING"
        instructions = "Demonstrate mastery-level comprehension of sophisticated text."
        orderIndex = 0
        duration = 45
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "The epistemological implications of quantum mechanics extend far beyond the realm of physics, challenging fundamental assumptions about causality, determinism, and the nature of reality itself. The observer effect, whereby measurement inevitably alters the observed phenomenon, has precipitated profound philosophical debates regarding the relationship between consciousness and physical reality. Some theorists posit that this suggests a participatory universe, while skeptics maintain that such interpretations conflate empirical observation with metaphysical speculation. What philosophical issue does the observer effect raise?"
                orderIndex = 0
                points = 5.0
                explanation = "The relationship between consciousness and physical reality"
                metadata = @{}
                options = @(
                    @{ label = "The speed of light limitations"; orderIndex = 0; isCorrect = $false }
                    @{ label = "The relationship between consciousness and reality"; orderIndex = 1; isCorrect = $true }
                    @{ label = "The existence of parallel universes"; orderIndex = 2; isCorrect = $false }
                    @{ label = "The nature of time travel"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "All theorists agree on the metaphysical implications of quantum mechanics."
                orderIndex = 1
                points = 3.0
                explanation = "There is debate between different interpretations"
                metadata = @{}
                options = @(
                    @{ label = "True"; orderIndex = 0; isCorrect = $false }
                    @{ label = "False"; orderIndex = 1; isCorrect = $true }
                )
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "What do skeptics argue about participatory universe theories?"
                orderIndex = 2
                points = 5.0
                explanation = "They conflate empirical observation with metaphysical speculation"
                metadata = @{}
                options = @(
                    @{ label = "They are completely accurate"; orderIndex = 0; isCorrect = $false }
                    @{ label = "They conflate observation with speculation"; orderIndex = 1; isCorrect = $true }
                    @{ label = "They should be universally accepted"; orderIndex = 2; isCorrect = $false }
                    @{ label = "They have no scientific basis"; orderIndex = 3; isCorrect = $false }
                )
            }
        )
    }
    @{
        title = "Mastery-Level Grammar and Lexis"
        partType = "GRAMMAR"
        instructions = "Demonstrate native-like command of English."
        orderIndex = 1
        duration = 45
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Were it not for the intervention of several key stakeholders, the initiative ___ collapsed entirely."
                orderIndex = 0
                points = 4.0
                explanation = "Conditional inversion with perfect modal"
                metadata = @{}
                options = @(
                    @{ label = "would"; orderIndex = 0; isCorrect = $false }
                    @{ label = "would have"; orderIndex = 1; isCorrect = $true }
                    @{ label = "will have"; orderIndex = 2; isCorrect = $false }
                    @{ label = "had"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "The phenomenon, ___ ramifications we are only beginning to comprehend, demands immediate attention. (whose/which)"
                orderIndex = 1
                points = 4.0
                explanation = "Possessive relative with abstract noun"
                metadata = @{ correctAnswer = "whose" }
                options = @()
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Notwithstanding the compelling evidence presented, the committee remained ___ in their opposition."
                orderIndex = 2
                points = 4.0
                explanation = "Advanced vocabulary: steadfast/resolute"
                metadata = @{}
                options = @(
                    @{ label = "adamant"; orderIndex = 0; isCorrect = $true }
                    @{ label = "happy"; orderIndex = 1; isCorrect = $false }
                    @{ label = "confused"; orderIndex = 2; isCorrect = $false }
                    @{ label = "interested"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "WORD_ORDERING"
                prompt = "Rearrange: circumstances / no / under / whatsoever / would / I / condone / such / behavior"
                orderIndex = 3
                points = 5.0
                explanation = "Complex emphatic negative structure"
                metadata = @{ correctAnswer = "Under no circumstances whatsoever would I condone such behavior" }
                options = @()
            }
        )
    }
    @{
        title = "Sophisticated Academic Writing"
        partType = "WRITING"
        instructions = "Produce publication-quality academic discourse."
        orderIndex = 2
        duration = 60
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Critically examine the proposition that artificial intelligence poses an existential threat to humanity. Your response should demonstrate sophisticated understanding of technological, ethical, and philosophical dimensions, incorporating relevant theoretical frameworks and empirical evidence. (Write 350-400 words)"
                orderIndex = 0
                points = 35.0
                explanation = "Check for: exceptional analytical depth, sophisticated argumentation, precise academic register, complex syntactic structures, nuanced vocabulary, seamless coherence, critical synthesis of multiple perspectives"
                metadata = @{}
                options = @()
            }
        )
    }
)

Create-Exam -Title "CEFR C2 English Test - Part 1" -Level "C2" `
    -Description "Mastery-level test for near-native proficiency" `
    -Duration 150 -PassingScore 85.0 -Parts $c2Exam1Parts

# C2 Exam 2: Native-Like Proficiency
$c2Exam2Parts = @(
    @{
        title = "Reading Comprehension"
        partType = "READING"
        instructions = "Analyze highly complex academic discourse."
        orderIndex = 0
        duration = 45
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "The hermeneutic circle, a cornerstone of interpretive methodology, posits that understanding emerges through the dialectical interplay between parts and whole. This iterative process, whereby preliminary comprehension of constituent elements informs holistic interpretation, which in turn refines understanding of individual components, challenges linear models of knowledge acquisition. Critics contend that this circularity risks epistemic relativism, while proponents argue it accurately reflects the phenomenology of human understanding. What does the hermeneutic circle describe?"
                orderIndex = 0
                points = 5.0
                explanation = "Dialectical interplay between parts and whole in understanding"
                metadata = @{}
                options = @(
                    @{ label = "A geometric shape in philosophy"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Dialectical interplay between parts and whole"; orderIndex = 1; isCorrect = $true }
                    @{ label = "A circular argument fallacy"; orderIndex = 2; isCorrect = $false }
                    @{ label = "A method of scientific experimentation"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "The hermeneutic circle supports linear models of knowledge acquisition."
                orderIndex = 1
                points = 3.0
                explanation = "It challenges linear models"
                metadata = @{}
                options = @(
                    @{ label = "True"; orderIndex = 0; isCorrect = $false }
                    @{ label = "False"; orderIndex = 1; isCorrect = $true }
                )
            }
        )
    }
    @{
        title = "Advanced Language Mastery"
        partType = "GRAMMAR"
        instructions = "Demonstrate exceptional command of English."
        orderIndex = 1
        duration = 45
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "Seldom ___ such a comprehensive analysis of the phenomenon been undertaken."
                orderIndex = 0
                points = 4.0
                explanation = "Negative adverb inversion with present perfect passive"
                metadata = @{}
                options = @(
                    @{ label = "has"; orderIndex = 0; isCorrect = $true }
                    @{ label = "have"; orderIndex = 1; isCorrect = $false }
                    @{ label = "had"; orderIndex = 2; isCorrect = $false }
                    @{ label = "was"; orderIndex = 3; isCorrect = $false }
                )
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "The paradigm, ___ influence pervades contemporary thought, originated in the early twentieth century. (whose/which)"
                orderIndex = 1
                points = 4.0
                explanation = "Possessive relative with abstract noun"
                metadata = @{ correctAnswer = "whose" }
                options = @()
            }
        )
    }
    @{
        title = "Expert-Level Academic Writing"
        partType = "WRITING"
        instructions = "Produce expert-level analytical discourse."
        orderIndex = 2
        duration = 60
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Evaluate the contention that postmodernism represents an epistemological crisis rather than a legitimate philosophical movement. Your analysis should engage with key theoretical positions, demonstrate sophisticated understanding of intellectual history, and present a nuanced, well-substantiated argument. (Write 400-450 words)"
                orderIndex = 0
                points = 35.0
                explanation = "Check for: exceptional analytical sophistication, mastery of academic discourse, precise theoretical engagement, complex argumentation, native-like fluency, seamless integration of multiple perspectives"
                metadata = @{}
                options = @()
            }
        )
    }
)

Create-Exam -Title "CEFR C2 English Test - Part 2" -Level "C2" `
    -Description "Proficiency test for native-like mastery" `
    -Duration 150 -PassingScore 85.0 -Parts $c2Exam2Parts

Write-Host "C2 exams created successfully!" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All CEFR Exams Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  A1: 2 exams (Beginner)" -ForegroundColor White
Write-Host "  A2: 2 exams (Elementary)" -ForegroundColor White
Write-Host "  B1: 2 exams (Intermediate)" -ForegroundColor White
Write-Host "  B2: 2 exams (Upper Intermediate)" -ForegroundColor White
Write-Host "  C1: 2 exams (Advanced)" -ForegroundColor White
Write-Host "  C2: 2 exams (Proficiency)" -ForegroundColor White
Write-Host "  Total: 12 comprehensive CEFR exams" -ForegroundColor Green
Write-Host ""
Write-Host "All exams include:" -ForegroundColor Cyan
Write-Host "  - Reading Comprehension" -ForegroundColor Gray
Write-Host "  - Grammar and Vocabulary" -ForegroundColor Gray
Write-Host "  - Writing Tasks" -ForegroundColor Gray
Write-Host "  - Correct answers properly configured" -ForegroundColor Gray
Write-Host ""
