# Seed CEFR Exams - A1, A2, B1
$baseUrl = "http://localhost:8088/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Seeding CEFR Exams (A1, A2, B1)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to create exam with parts and questions
function Create-Exam {
    param($examData, $parts)
    
    Write-Host "Creating $($examData.level) exam: $($examData.title)..." -ForegroundColor Yellow
    $exam = Invoke-RestMethod -Uri "$baseUrl/exams" -Method Post -Body ($examData | ConvertTo-Json) -ContentType "application/json"
    $examId = $exam.id
    Write-Host "  Exam created: $examId" -ForegroundColor Green
    
    foreach ($partData in $parts) {
        Write-Host "  Creating part: $($partData.part.title)..." -ForegroundColor White
        $part = Invoke-RestMethod -Uri "$baseUrl/exam-parts/exam/$examId" -Method Post -Body ($partData.part | ConvertTo-Json) -ContentType "application/json"
        $partId = $part.id
        
        foreach ($questionData in $partData.questions) {
            $question = Invoke-RestMethod -Uri "$baseUrl/questions/part/$partId" -Method Post -Body ($questionData | ConvertTo-Json -Depth 10) -ContentType "application/json"
        }
        Write-Host "    Added $($partData.questions.Count) questions" -ForegroundColor Gray
    }
    
    # Publish the exam
    Invoke-RestMethod -Uri "$baseUrl/exams/$examId/publish" -Method Put
    Write-Host "  Exam published!" -ForegroundColor Green
    Write-Host ""
    
    return $examId
}

Write-Host "Starting exam creation..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# A1 EXAM - Beginner Level
# ============================================
$a1Exam = @{
    title = "CEFR A1 English Proficiency Test"
    level = "A1"
    description = "Basic English test for beginners covering simple everyday situations"
    totalDuration = 60
    passingScore = 60
}

$a1Parts = @(
    @{
        part = @{
            title = "Reading Comprehension"
            partType = "READING"
            instructions = "Read the text and answer the questions"
            orderIndex = 0
            timeLimit = 15
            readingText = "Hello! My name is Sarah. I am 25 years old. I live in London with my family. I have one brother and one sister. My brother is 20 and my sister is 15. I work in a school. I am a teacher. I teach English to children. I like my job very much. In my free time, I like to read books and watch movies."
        }
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "How old is Sarah?"
                orderIndex = 0
                points = 2.0
                explanation = "The text states 'I am 25 years old'"
                metadata = @{}
                options = @(
                    @{ label = "20 years old"; orderIndex = 0; isCorrect = $false }
                    @{ label = "25 years old"; orderIndex = 1; isCorrect = $true }
                    @{ label = "15 years old"; orderIndex = 2; isCorrect = $false }
                    @{ label = "30 years old"; orderIndex = 3; isCorrect = $false }
                )
                correctAnswer = @{ answerData = @{ optionIndex = 1 } }
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "Sarah has two sisters."
                orderIndex = 1
                points = 1.0
                explanation = "Sarah has one brother and one sister, not two sisters"
                metadata = @{}
                correctAnswer = @{ answerData = @{ value = $false } }
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "What is Sarah's job?"
                orderIndex = 2
                points = 2.0
                explanation = "The text says 'I am a teacher'"
                metadata = @{}
                options = @(
                    @{ label = "Doctor"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Teacher"; orderIndex = 1; isCorrect = $true }
                    @{ label = "Student"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Nurse"; orderIndex = 3; isCorrect = $false }
                )
                correctAnswer = @{ answerData = @{ optionIndex = 1 } }
            }
        )
    }
    @{
        part = @{
            title = "Grammar and Vocabulary"
            partType = "GRAMMAR"
            instructions = "Choose the correct answer"
            orderIndex = 1
            timeLimit = 20
        }
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "I ___ a student."
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
                correctAnswer = @{ answerData = @{ optionIndex = 0 } }
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "She ___ to school every day. (go)"
                orderIndex = 1
                points = 1.5
                explanation = "Third person singular present simple takes 's'"
                metadata = @{}
                correctAnswer = @{ answerData = @{ text = "goes" } }
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "There ___ three apples on the table."
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
                correctAnswer = @{ answerData = @{ optionIndex = 1 } }
            }
            @{
                questionType = "WORD_ORDERING"
                prompt = "Put the words in the correct order: name / is / What / your / ?"
                orderIndex = 3
                points = 2.0
                explanation = "Question word order: What + is + your + name + ?"
                metadata = @{}
                correctAnswer = @{ answerData = @{ order = @("What", "is", "your", "name", "?") } }
            }
        )
    }
    @{
        part = @{
            title = "Writing"
            partType = "WRITING"
            instructions = "Write a short text about yourself (30-50 words)"
            orderIndex = 2
            timeLimit = 25
        }
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Write about yourself. Include: your name, age, where you live, and what you like to do."
                orderIndex = 0
                points = 10.0
                explanation = "Grading criteria: Basic personal information, simple sentences, basic vocabulary"
                metadata = @{ minWords = 30; maxWords = 50 }
                correctAnswer = @{ answerData = @{ rubric = "Check for: name, age, location, hobbies. Simple present tense. Basic sentence structure." } }
            }
        )
    }
)

$a1ExamId = Create-Exam -examData $a1Exam -parts $a1Parts

# ============================================
# A2 EXAM - Elementary Level
# ============================================
$a2Exam = @{
    title = "CEFR A2 English Proficiency Test"
    level = "A2"
    description = "Elementary English test covering everyday topics and simple communication"
    totalDuration = 75
    passingScore = 65
}

$a2Parts = @(
    @{
        part = @{
            title = "Reading Comprehension"
            partType = "READING"
            instructions = "Read the email and answer the questions"
            orderIndex = 0
            timeLimit = 20
            readingText = "Dear Maria, Thank you for your email. I'm happy to hear that you're coming to visit next month! I have some great plans for your visit. On Saturday, we can go shopping in the city center. There are many nice shops and cafes there. On Sunday, I think we should visit the museum. They have a new exhibition about modern art. It's very interesting! In the evening, we can have dinner at my favorite Italian restaurant. The food is delicious and not too expensive. Let me know if you like these ideas. I can't wait to see you! Best wishes, Anna"
        }
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "When is Maria coming to visit?"
                orderIndex = 0
                points = 2.0
                explanation = "The email mentions 'next month'"
                metadata = @{}
                options = @(
                    @{ label = "This week"; orderIndex = 0; isCorrect = $false }
                    @{ label = "Next month"; orderIndex = 1; isCorrect = $true }
                    @{ label = "Next year"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Tomorrow"; orderIndex = 3; isCorrect = $false }
                )
                correctAnswer = @{ answerData = @{ optionIndex = 1 } }
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "Anna wants to visit a museum on Saturday."
                orderIndex = 1
                points = 1.5
                explanation = "The museum visit is planned for Sunday, not Saturday"
                metadata = @{}
                correctAnswer = @{ answerData = @{ value = $false } }
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "What does Anna say about the restaurant?"
                orderIndex = 2
                points = 2.0
                explanation = "Anna mentions the food is delicious and not too expensive"
                metadata = @{}
                options = @(
                    @{ label = "It's very expensive"; orderIndex = 0; isCorrect = $false }
                    @{ label = "The food is delicious and not too expensive"; orderIndex = 1; isCorrect = $true }
                    @{ label = "It's closed on Sunday"; orderIndex = 2; isCorrect = $false }
                    @{ label = "It only serves breakfast"; orderIndex = 3; isCorrect = $false }
                )
                correctAnswer = @{ answerData = @{ optionIndex = 1 } }
            }
            @{
                questionType = "MATCHING"
                prompt = "Match the activities with the days"
                orderIndex = 3
                points = 3.0
                explanation = "Saturday: shopping, Sunday: museum, Evening: dinner"
                metadata = @{}
                correctAnswer = @{ answerData = @{ pairs = @(
                    @{ left = "Shopping"; right = "Saturday" }
                    @{ left = "Museum"; right = "Sunday" }
                    @{ left = "Dinner"; right = "Evening" }
                ) } }
            }
        )
    }
    @{
        part = @{
            title = "Grammar and Vocabulary"
            partType = "GRAMMAR"
            instructions = "Complete the sentences with the correct form"
            orderIndex = 1
            timeLimit = 25
        }
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "I ___ to Paris last year."
                orderIndex = 0
                points = 1.5
                explanation = "Past simple tense for completed actions"
                metadata = @{}
                options = @(
                    @{ label = "go"; orderIndex = 0; isCorrect = $false }
                    @{ label = "went"; orderIndex = 1; isCorrect = $true }
                    @{ label = "going"; orderIndex = 2; isCorrect = $false }
                    @{ label = "will go"; orderIndex = 3; isCorrect = $false }
                )
                correctAnswer = @{ answerData = @{ optionIndex = 1 } }
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "She is ___ than her sister. (tall)"
                orderIndex = 1
                points = 1.5
                explanation = "Comparative form of tall"
                metadata = @{}
                correctAnswer = @{ answerData = @{ text = "taller" } }
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "We ___ watching TV when you called."
                orderIndex = 2
                points = 1.5
                explanation = "Past continuous for actions in progress"
                metadata = @{}
                options = @(
                    @{ label = "are"; orderIndex = 0; isCorrect = $false }
                    @{ label = "were"; orderIndex = 1; isCorrect = $true }
                    @{ label = "was"; orderIndex = 2; isCorrect = $false }
                    @{ label = "is"; orderIndex = 3; isCorrect = $false }
                )
                correctAnswer = @{ answerData = @{ optionIndex = 1 } }
            }
            @{
                questionType = "DROPDOWN_SELECT"
                prompt = "I have ___ been to Japan."
                orderIndex = 3
                points = 1.0
                explanation = "Present perfect with 'never'"
                metadata = @{}
                options = @(
                    @{ label = "never"; orderIndex = 0; isCorrect = $true }
                    @{ label = "ever"; orderIndex = 1; isCorrect = $false }
                    @{ label = "always"; orderIndex = 2; isCorrect = $false }
                    @{ label = "sometimes"; orderIndex = 3; isCorrect = $false }
                )
                correctAnswer = @{ answerData = @{ optionIndex = 0 } }
            }
        )
    }
    @{
        part = @{
            title = "Writing"
            partType = "WRITING"
            instructions = "Write an email to a friend (60-80 words)"
            orderIndex = 2
            timeLimit = 30
        }
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Write an email to your friend inviting them to your birthday party. Include: date, time, place, and what you will do."
                orderIndex = 0
                points = 12.0
                explanation = "Grading criteria: Email format, all required information, appropriate language, correct grammar"
                metadata = @{ minWords = 60; maxWords = 80 }
                correctAnswer = @{ answerData = @{ rubric = "Check for: greeting, date/time/place, activities, closing. Use of future tense. Appropriate informal language." } }
            }
        )
    }
)

$a2ExamId = Create-Exam -examData $a2Exam -parts $a2Parts

# ============================================
# B1 EXAM - Intermediate Level
# ============================================
$b1Exam = @{
    title = "CEFR B1 English Proficiency Test"
    level = "B1"
    description = "Intermediate English test covering a range of topics and situations"
    totalDuration = 90
    passingScore = 70
}

$b1Parts = @(
    @{
        part = @{
            title = "Reading Comprehension"
            partType = "READING"
            instructions = "Read the article and answer the questions"
            orderIndex = 0
            timeLimit = 25
            readingText = "The Benefits of Learning a Second Language. Learning a second language has become increasingly important in our globalized world. Research shows that bilingual individuals often have better problem-solving skills and improved memory compared to monolingual speakers. Moreover, learning a new language opens doors to different cultures and perspectives, allowing people to communicate with a wider range of individuals. From a career perspective, being bilingual can significantly increase job opportunities, especially in international companies. Many employers actively seek candidates who can speak multiple languages. Additionally, studies suggest that learning a second language may delay the onset of dementia and other age-related cognitive decline. Despite these benefits, many people find learning a new language challenging. However, with modern technology and online resources, it has never been easier to start learning. The key is consistency and practice. Even dedicating just 15-20 minutes daily can lead to significant progress over time."
        }
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "According to the text, what is one cognitive benefit of being bilingual?"
                orderIndex = 0
                points = 2.5
                explanation = "The text mentions better problem-solving skills and improved memory"
                metadata = @{}
                options = @(
                    @{ label = "Better problem-solving skills"; orderIndex = 0; isCorrect = $true }
                    @{ label = "Faster reading speed"; orderIndex = 1; isCorrect = $false }
                    @{ label = "Better handwriting"; orderIndex = 2; isCorrect = $false }
                    @{ label = "Improved eyesight"; orderIndex = 3; isCorrect = $false }
                )
                correctAnswer = @{ answerData = @{ optionIndex = 0 } }
            }
            @{
                questionType = "TRUE_FALSE"
                prompt = "The article suggests that learning a language is easier now than in the past."
                orderIndex = 1
                points = 2.0
                explanation = "The text states 'with modern technology and online resources, it has never been easier'"
                metadata = @{}
                correctAnswer = @{ answerData = @{ value = $true } }
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "How much daily practice does the article recommend?"
                orderIndex = 2
                points = 2.0
                explanation = "The text mentions 15-20 minutes daily"
                metadata = @{}
                options = @(
                    @{ label = "5-10 minutes"; orderIndex = 0; isCorrect = $false }
                    @{ label = "15-20 minutes"; orderIndex = 1; isCorrect = $true }
                    @{ label = "30-40 minutes"; orderIndex = 2; isCorrect = $false }
                    @{ label = "1-2 hours"; orderIndex = 3; isCorrect = $false }
                )
                correctAnswer = @{ answerData = @{ optionIndex = 1 } }
            }
            @{
                questionType = "OPEN_WRITING"
                prompt = "In your own words, explain why employers value bilingual candidates according to the text."
                orderIndex = 3
                points = 3.5
                explanation = "Should mention international companies and wider communication abilities"
                metadata = @{ minWords = 20; maxWords = 40 }
                correctAnswer = @{ answerData = @{ rubric = "Check for understanding of: international business needs, communication with diverse clients/partners, competitive advantage" } }
            }
        )
    }
    @{
        part = @{
            title = "Grammar and Vocabulary"
            partType = "GRAMMAR"
            instructions = "Choose the correct answer or complete the sentences"
            orderIndex = 1
            timeLimit = 30
        }
        questions = @(
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "If I ___ more time, I would travel around the world."
                orderIndex = 0
                points = 2.0
                explanation = "Second conditional: If + past simple, would + infinitive"
                metadata = @{}
                options = @(
                    @{ label = "have"; orderIndex = 0; isCorrect = $false }
                    @{ label = "had"; orderIndex = 1; isCorrect = $true }
                    @{ label = "will have"; orderIndex = 2; isCorrect = $false }
                    @{ label = "would have"; orderIndex = 3; isCorrect = $false }
                )
                correctAnswer = @{ answerData = @{ optionIndex = 1 } }
            }
            @{
                questionType = "FILL_IN_GAP"
                prompt = "The report must ___ by Friday. (complete - passive voice)"
                orderIndex = 1
                points = 2.0
                explanation = "Passive voice with modal verb: must be + past participle"
                metadata = @{}
                correctAnswer = @{ answerData = @{ text = "be completed" } }
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "She's been working here ___ 2015."
                orderIndex = 2
                points = 1.5
                explanation = "Use 'since' with specific point in time"
                metadata = @{}
                options = @(
                    @{ label = "for"; orderIndex = 0; isCorrect = $false }
                    @{ label = "since"; orderIndex = 1; isCorrect = $true }
                    @{ label = "during"; orderIndex = 2; isCorrect = $false }
                    @{ label = "while"; orderIndex = 3; isCorrect = $false }
                )
                correctAnswer = @{ answerData = @{ optionIndex = 1 } }
            }
            @{
                questionType = "WORD_ORDERING"
                prompt = "Put the words in order: have / you / ever / to / been / Australia / ?"
                orderIndex = 3
                points = 2.5
                explanation = "Present perfect question structure"
                metadata = @{}
                correctAnswer = @{ answerData = @{ order = @("Have", "you", "ever", "been", "to", "Australia", "?") } }
            }
            @{
                questionType = "MULTIPLE_CHOICE"
                prompt = "I wish I ___ speak Chinese fluently."
                orderIndex = 4
                points = 2.0
                explanation = "Wish + past simple for present unreal situations"
                metadata = @{}
                options = @(
                    @{ label = "can"; orderIndex = 0; isCorrect = $false }
                    @{ label = "could"; orderIndex = 1; isCorrect = $true }
                    @{ label = "will"; orderIndex = 2; isCorrect = $false }
                    @{ label = "would"; orderIndex = 3; isCorrect = $false }
                )
                correctAnswer = @{ answerData = @{ optionIndex = 1 } }
            }
        )
    }
    @{
        part = @{
            title = "Writing"
            partType = "WRITING"
            instructions = "Write a formal letter or essay (120-150 words)"
            orderIndex = 2
            timeLimit = 35
        }
        questions = @(
            @{
                questionType = "OPEN_WRITING"
                prompt = "Write a letter to your local council suggesting improvements to public transportation in your area. Include: current problems, your suggestions, and expected benefits."
                orderIndex = 0
                points = 15.0
                explanation = "Grading criteria: Formal letter format, clear structure, appropriate language, grammar accuracy, coherent arguments"
                metadata = @{ minWords = 120; maxWords = 150 }
                correctAnswer = @{ answerData = @{ rubric = "Check for: formal greeting/closing, clear problem statement, 2-3 specific suggestions, explanation of benefits, appropriate formal language, paragraphing, grammar accuracy" } }
            }
        )
    }
)

$b1ExamId = Create-Exam -examData $b1Exam -parts $b1Parts

# ============================================
# Summary
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Exam Seeding Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Created Exams:" -ForegroundColor White
Write-Host "  A1 Exam ID: $a1ExamId" -ForegroundColor Yellow
Write-Host "  A2 Exam ID: $a2ExamId" -ForegroundColor Yellow
Write-Host "  B1 Exam ID: $b1ExamId" -ForegroundColor Yellow
Write-Host ""
Write-Host "All exams have been published and are ready for students!" -ForegroundColor Green
Write-Host "View them at: http://localhost:4200/student/exams" -ForegroundColor Cyan
Write-Host ""
