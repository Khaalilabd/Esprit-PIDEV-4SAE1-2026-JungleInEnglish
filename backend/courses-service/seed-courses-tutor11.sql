-- =====================================================
-- SEED COURSES FOR TUTOR ID 11
-- =====================================================
-- Run this AFTER starting courses-service (tables auto-created)
-- Categories are auto-created by DataInitializer
-- =====================================================

-- Delete existing data (in correct order due to foreign keys)
DELETE FROM lesson_media;
DELETE FROM lesson_progress;
DELETE FROM lessons;
DELETE FROM chapter_objectives;
DELETE FROM chapter_progress;
DELETE FROM chapters;
DELETE FROM pack_enrollments;
DELETE FROM pack_courses;
DELETE FROM packs;
DELETE FROM course_enrollments;
DELETE FROM courses;

-- Reset sequences
ALTER SEQUENCE IF EXISTS courses_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS chapters_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS lessons_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS lesson_media_id_seq RESTART WITH 1;

-- =====================================================
-- COURSE 1: Business English Mastery (Category: Business English)
-- =====================================================
INSERT INTO courses (title, description, tutor_id, category, level, duration, price, thumbnail_url, file_url, is_featured, status, created_at, updated_at)
VALUES (
    'Business English Mastery',
    'Master professional English communication for the modern workplace. Learn essential business vocabulary, email writing, presentation skills, and meeting etiquette. Perfect for professionals looking to advance their careers in international business environments.',
    11,
    'Business English',
    'B1',
    480,
    149.99,
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200',
    true,
    'PUBLISHED',
    NOW(),
    NOW()
);

-- Chapter 1.1: Business Communication Fundamentals
INSERT INTO chapters (course_id, title, description, order_index, estimated_duration, is_published, created_at, updated_at)
VALUES (1, 'Business Communication Fundamentals', 'Learn the foundations of professional business communication in English', 1, 120, true, NOW(), NOW());

-- Lesson 1.1.1: Introduction to Business English (VIDEO)
INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    1, 'Introduction to Business English', 'Understanding the importance of professional English in the workplace',
    '<h2>Welcome to Business English Mastery</h2><p>In today''s globalized business world, <strong>effective English communication</strong> is essential for career success. This course will equip you with the skills needed to communicate confidently in professional settings.</p><h3>What You''ll Learn</h3><ul><li>Professional vocabulary and expressions</li><li>Email and report writing</li><li>Presentation and meeting skills</li><li>Negotiation techniques</li><li>Cross-cultural communication</li></ul><h3>Key Business English Principles</h3><ol><li><strong>Formality:</strong> Use appropriate levels of formality based on context</li><li><strong>Clarity:</strong> Be clear and concise in your communication</li><li><strong>Professionalism:</strong> Maintain a professional tone at all times</li><li><strong>Accuracy:</strong> Ensure grammatical correctness and precision</li></ol><blockquote><p>"The art of communication is the language of leadership." - James Humes</p></blockquote>',
    'VIDEO', 1, 15, true, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (1, 'Introduction to Business English', 'VIDEO', 'https://www.youtube.com/embed/8irSFvoyQHw', 1, NOW(), NOW());

-- Lesson 1.1.2: Professional Email Writing (VIDEO)
INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    1, 'Professional Email Writing', 'Master the art of writing effective business emails',
    '<h2>Professional Email Writing</h2><p>Email is the most common form of business communication. Learning to write clear, professional emails is crucial for success.</p><h3>Email Structure</h3><pre><code>Subject Line: Clear and specific\nGreeting: Dear Mr./Ms. [Last Name],\nOpening: State your purpose\nBody: Provide details\nClosing: Call to action\nSign-off: Best regards, [Your Name]</code></pre><h3>Essential Email Phrases</h3><table style="width:100%;border-collapse:collapse;"><tr style="background-color:#f3f4f6;"><th style="padding:8px;border:1px solid #ddd;">Purpose</th><th style="padding:8px;border:1px solid #ddd;">Phrase</th></tr><tr><td style="padding:8px;border:1px solid #ddd;"><strong>Opening</strong></td><td style="padding:8px;border:1px solid #ddd;">"I am writing to inquire about..."</td></tr><tr><td style="padding:8px;border:1px solid #ddd;"><strong>Requesting</strong></td><td style="padding:8px;border:1px solid #ddd;">"Could you please provide..."</td></tr><tr><td style="padding:8px;border:1px solid #ddd;"><strong>Apologizing</strong></td><td style="padding:8px;border:1px solid #ddd;">"I apologize for any inconvenience..."</td></tr></table>',
    'VIDEO', 2, 20, false, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (2, 'How to Write Professional Emails', 'VIDEO', 'https://www.youtube.com/embed/3ZkarHyUnYU', 1, NOW(), NOW());

-- Lesson 1.1.3: Business Vocabulary (TEXT with IMAGE)
INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    1, 'Essential Business Vocabulary', 'Learn key business terms and expressions',
    '<h2>Essential Business Vocabulary</h2><p>Expand your professional vocabulary with these commonly used business terms.</p><h3>Financial Terms</h3><ul><li><strong>Revenue:</strong> Total income generated by a business</li><li><strong>Profit margin:</strong> Percentage of revenue that is profit</li><li><strong>ROI (Return on Investment):</strong> Measure of profitability</li><li><strong>Budget:</strong> Financial plan for a specific period</li><li><strong>Forecast:</strong> Prediction of future financial performance</li></ul><h3>Meeting Vocabulary</h3><ul><li><strong>Agenda:</strong> List of topics to discuss in a meeting</li><li><strong>Minutes:</strong> Written record of what was discussed</li><li><strong>Action items:</strong> Tasks to be completed after the meeting</li><li><strong>Stakeholder:</strong> Person with interest in a project or decision</li></ul>',
    'TEXT', 3, 15, false, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (3, 'Business Vocabulary Guide', 'DOCUMENT', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200', 1, NOW(), NOW());

-- Chapter 1.2: Meetings and Presentations
INSERT INTO chapters (course_id, title, description, order_index, estimated_duration, is_published, created_at, updated_at)
VALUES (1, 'Meetings and Presentations', 'Master professional meetings and presentation skills', 2, 150, true, NOW(), NOW());

-- Lesson 1.2.1: Running Effective Meetings (VIDEO)
INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    2, 'Running Effective Meetings', 'Learn how to conduct productive business meetings',
    '<h2>Running Effective Meetings</h2><p>Meetings are essential for collaboration and decision-making. Learn how to run them effectively.</p><h3>Meeting Phases</h3><ol><li><strong>Opening:</strong> Welcome participants and state objectives</li><li><strong>Discussion:</strong> Address agenda items systematically</li><li><strong>Decision-making:</strong> Reach conclusions and agreements</li><li><strong>Closing:</strong> Summarize and assign action items</li></ol><h3>Useful Meeting Phrases</h3><ul><li>"Let''s get started with today''s agenda..."</li><li>"Moving on to the next item..."</li><li>"Could you elaborate on that point?"</li><li>"Let''s take a vote on this matter..."</li><li>"To summarize our discussion..."</li></ul>',
    'VIDEO', 1, 25, false, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (4, 'Business Meeting Skills', 'VIDEO', 'https://www.youtube.com/embed/ibfRWj4pMbA', 1, NOW(), NOW());


-- =====================================================
-- COURSE 2: English Grammar Complete Guide (Category: Grammar)
-- =====================================================
INSERT INTO courses (title, description, tutor_id, category, level, duration, price, thumbnail_url, file_url, is_featured, status, created_at, updated_at)
VALUES (
    'English Grammar Complete Guide',
    'Comprehensive grammar course covering all essential English grammar rules from beginner to advanced level. Perfect your understanding of tenses, conditionals, modal verbs, and complex structures with clear explanations and practical examples.',
    11, 'Grammar', 'A2', 600, 99.99,
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200',
    true, 'PUBLISHED', NOW(), NOW()
);

INSERT INTO chapters (course_id, title, description, order_index, estimated_duration, is_published, created_at, updated_at)
VALUES (2, 'Verb Tenses Mastery', 'Master all English verb tenses with clear explanations and examples', 1, 180, true, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    3, 'Present Tenses Overview', 'Learn all present tenses: simple, continuous, perfect, and perfect continuous',
    '<h2>Present Tenses in English</h2><p>English has four present tenses, each with specific uses.</p><h3>1. Present Simple</h3><p><strong>Form:</strong> Subject + base verb (+ s/es for 3rd person)</p><p><strong>Uses:</strong></p><ul><li>Habits and routines: "I work every day."</li><li>General truths: "Water boils at 100°C."</li><li>Scheduled events: "The train leaves at 9 AM."</li></ul><h3>2. Present Continuous</h3><p><strong>Form:</strong> Subject + am/is/are + verb-ing</p><p><strong>Uses:</strong></p><ul><li>Actions happening now: "I am studying."</li><li>Temporary situations: "She is living in Paris."</li><li>Future arrangements: "We are meeting tomorrow."</li></ul>',
    'VIDEO', 1, 25, true, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (5, 'Present Tenses Explained', 'VIDEO', 'https://www.youtube.com/embed/PljDuynF-j0', 1, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    3, 'Past Tenses Complete Guide', 'Master all past tenses with practical examples',
    '<h2>Past Tenses in English</h2><h3>1. Past Simple</h3><p><strong>Form:</strong> Subject + verb-ed (or irregular form)</p><p><strong>Uses:</strong></p><ul><li>Completed actions: "I visited London last year."</li><li>Series of past actions: "She woke up, had breakfast, and left."</li></ul><h3>2. Past Continuous</h3><p><strong>Form:</strong> Subject + was/were + verb-ing</p><p><strong>Uses:</strong></p><ul><li>Actions in progress at specific past time: "I was sleeping at 10 PM."</li><li>Interrupted actions: "I was reading when the phone rang."</li></ul>',
    'VIDEO', 2, 20, false, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (6, 'Past Tenses Tutorial', 'VIDEO', 'https://www.youtube.com/embed/gPEMzFIHPWw', 1, NOW(), NOW());

INSERT INTO chapters (course_id, title, description, order_index, estimated_duration, is_published, created_at, updated_at)
VALUES (2, 'Conditionals and Modals', 'Master conditional sentences and modal verbs', 2, 120, true, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    4, 'All Conditional Types', 'Learn zero, first, second, third, and mixed conditionals',
    '<h2>Conditional Sentences</h2><h3>Zero Conditional (General Truths)</h3><p><strong>Form:</strong> If + present simple, present simple</p><p><strong>Example:</strong> "If you heat water to 100°C, it boils."</p><h3>First Conditional (Real Future Possibility)</h3><p><strong>Form:</strong> If + present simple, will + base verb</p><p><strong>Example:</strong> "If it rains, I will stay home."</p><h3>Second Conditional (Unreal Present)</h3><p><strong>Form:</strong> If + past simple, would + base verb</p><p><strong>Example:</strong> "If I had a million dollars, I would travel the world."</p>',
    'VIDEO', 1, 28, false, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (7, 'Conditionals Explained', 'VIDEO', 'https://www.youtube.com/embed/WQXwT83c8v8', 1, NOW(), NOW());


-- =====================================================
-- COURSE 3: Conversational English Fluency (Category: Conversation)
-- =====================================================
INSERT INTO courses (title, description, tutor_id, category, level, duration, price, thumbnail_url, file_url, is_featured, status, created_at, updated_at)
VALUES (
    'Conversational English Fluency',
    'Speak English confidently in everyday situations. Improve your speaking and listening skills through practical conversations, idioms, phrasal verbs, and real-world scenarios. Perfect for intermediate learners who want to sound more natural.',
    11, 'Conversation', 'B1', 420, 129.99,
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800',
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200',
    true, 'PUBLISHED', NOW(), NOW()
);

INSERT INTO chapters (course_id, title, description, order_index, estimated_duration, is_published, created_at, updated_at)
VALUES (3, 'Everyday Conversations', 'Master common daily conversation scenarios', 1, 140, true, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    5, 'Greetings and Introductions', 'Learn how to greet people and introduce yourself naturally',
    '<h2>Greetings and Introductions</h2><h3>Formal Greetings</h3><ul><li>"Good morning/afternoon/evening."</li><li>"How do you do?" (very formal)</li><li>"It''s a pleasure to meet you."</li><li>"Nice to meet you."</li></ul><h3>Informal Greetings</h3><ul><li>"Hi! / Hey!"</li><li>"How''s it going?"</li><li>"What''s up?"</li><li>"How are you doing?"</li></ul><h3>Introducing Yourself</h3><p><strong>Formal:</strong> "My name is [Name]. I work as a [job] at [company]."</p><p><strong>Informal:</strong> "I''m [Name]. I''m from [place]."</p>',
    'VIDEO', 1, 18, true, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (8, 'English Greetings and Introductions', 'VIDEO', 'https://www.youtube.com/embed/BuWH8C8RbGM', 1, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    5, 'Small Talk Mastery', 'Learn the art of casual conversation',
    '<h2>Making Small Talk</h2><h3>Safe Small Talk Topics</h3><ul><li><strong>Weather:</strong> "Beautiful day, isn''t it?"</li><li><strong>Weekend plans:</strong> "Any plans for the weekend?"</li><li><strong>Hobbies:</strong> "What do you like to do in your free time?"</li><li><strong>Travel:</strong> "Have you traveled anywhere interesting lately?"</li></ul><h3>Keeping Conversation Going</h3><ul><li>Ask open-ended questions: "What was that like?"</li><li>Show interest: "That sounds interesting!"</li><li>Share related experiences: "I had a similar experience..."</li></ul>',
    'VIDEO', 2, 20, false, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (9, 'Small Talk in English', 'VIDEO', 'https://www.youtube.com/embed/bZtHbp6ybWs', 1, NOW(), NOW());

INSERT INTO chapters (course_id, title, description, order_index, estimated_duration, is_published, created_at, updated_at)
VALUES (3, 'Idioms and Common Expressions', 'Learn popular English idioms and expressions', 2, 100, true, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    6, 'Essential English Idioms', 'Learn the most common English idioms',
    '<h2>Common English Idioms</h2><h3>Time-Related Idioms</h3><ul><li><strong>In the nick of time:</strong> Just in time - "We arrived in the nick of time."</li><li><strong>Better late than never:</strong> It''s better to do something late than not at all</li><li><strong>Time flies:</strong> Time passes quickly - "Time flies when you''re having fun!"</li></ul><h3>Money Idioms</h3><ul><li><strong>Cost an arm and a leg:</strong> Very expensive - "That car cost an arm and a leg."</li><li><strong>Break the bank:</strong> Too expensive - "Dinner won''t break the bank."</li></ul>',
    'VIDEO', 1, 25, false, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (10, 'English Idioms and Phrases', 'VIDEO', 'https://www.youtube.com/embed/jShAS5OzFqI', 1, NOW(), NOW());


-- =====================================================
-- COURSE 4: IELTS Preparation Masterclass (Category: Test Preparation)
-- =====================================================
INSERT INTO courses (title, description, tutor_id, category, level, duration, price, thumbnail_url, file_url, is_featured, status, created_at, updated_at)
VALUES (
    'IELTS Preparation Masterclass',
    'Complete IELTS preparation covering all four sections: Listening, Reading, Writing, and Speaking. Achieve your target band score with proven strategies, practice materials, and expert guidance. Includes mock tests and personalized feedback.',
    11, 'Test Preparation', 'B2', 720, 199.99,
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200',
    true, 'PUBLISHED', NOW(), NOW()
);

INSERT INTO chapters (course_id, title, description, order_index, estimated_duration, is_published, created_at, updated_at)
VALUES (4, 'IELTS Listening Strategies', 'Master IELTS listening section with effective strategies', 1, 180, true, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    7, 'IELTS Listening Overview', 'Understanding the IELTS listening test format and scoring',
    '<h2>IELTS Listening Test Overview</h2><h3>Test Format</h3><ul><li><strong>Duration:</strong> 30 minutes + 10 minutes transfer time</li><li><strong>Sections:</strong> 4 sections with 10 questions each (40 total)</li><li><strong>Audio:</strong> Played only once</li></ul><h3>Section Breakdown</h3><ol><li><strong>Section 1:</strong> Conversation in everyday social context</li><li><strong>Section 2:</strong> Monologue in everyday social context</li><li><strong>Section 3:</strong> Conversation in educational/training context</li><li><strong>Section 4:</strong> Monologue on academic subject</li></ol><h3>Question Types</h3><ul><li>Multiple choice</li><li>Matching</li><li>Plan/map/diagram labeling</li><li>Form/note/table completion</li></ul>',
    'VIDEO', 1, 20, true, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (11, 'IELTS Listening Test Format', 'VIDEO', 'https://www.youtube.com/embed/Kq_k6R7M_Ks', 1, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    7, 'Top Listening Strategies', 'Learn proven strategies to improve your listening score',
    '<h2>IELTS Listening Strategies</h2><h3>Before Listening</h3><ol><li><strong>Read questions carefully:</strong> Understand what information you need</li><li><strong>Predict answers:</strong> Think about possible answers</li><li><strong>Identify keywords:</strong> Underline important words in questions</li></ol><h3>While Listening</h3><ol><li><strong>Listen for synonyms:</strong> Questions use different words than audio</li><li><strong>Follow the order:</strong> Answers come in sequence</li><li><strong>Write as you listen:</strong> Don''t wait until the end</li></ol><h3>Common Traps</h3><ul><li><strong>Distractors:</strong> Speaker mentions wrong answer before correct one</li><li><strong>Corrections:</strong> Speaker changes their mind</li></ul>',
    'VIDEO', 2, 25, false, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (12, 'IELTS Listening Tips and Strategies', 'VIDEO', 'https://www.youtube.com/embed/gZQZlp1c4is', 1, NOW(), NOW());

INSERT INTO chapters (course_id, title, description, order_index, estimated_duration, is_published, created_at, updated_at)
VALUES (4, 'IELTS Writing Mastery', 'Master both Task 1 and Task 2 writing', 2, 200, true, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    8, 'IELTS Writing Task 1 Guide', 'Learn how to describe graphs, charts, and diagrams',
    '<h2>IELTS Writing Task 1 (Academic)</h2><h3>Task Requirements</h3><ul><li><strong>Time:</strong> 20 minutes</li><li><strong>Word count:</strong> Minimum 150 words</li><li><strong>Task:</strong> Describe visual information</li></ul><h3>Structure</h3><ol><li><strong>Introduction:</strong> Paraphrase the question (1-2 sentences)</li><li><strong>Overview:</strong> Summarize main trends/features (2-3 sentences)</li><li><strong>Body Paragraph 1:</strong> Describe specific details</li><li><strong>Body Paragraph 2:</strong> Describe more specific details</li></ol><h3>Key Language</h3><p><strong>Increase:</strong> rose, increased, grew, climbed</p><p><strong>Decrease:</strong> fell, decreased, declined, dropped</p>',
    'VIDEO', 1, 30, false, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (13, 'IELTS Writing Task 1 Tutorial', 'VIDEO', 'https://www.youtube.com/embed/F8sJBxx7a6k', 1, NOW(), NOW());


-- =====================================================
-- COURSE 5: English Pronunciation Perfection (Category: Pronunciation)
-- =====================================================
INSERT INTO courses (title, description, tutor_id, category, level, duration, price, thumbnail_url, file_url, is_featured, status, created_at, updated_at)
VALUES (
    'English Pronunciation Perfection',
    'Perfect your English pronunciation with systematic training in sounds, stress, intonation, and connected speech. Speak clearly and confidently like a native speaker. Includes audio exercises, mouth position diagrams, and personalized feedback.',
    11, 'Pronunciation', 'A2', 300, 119.99,
    'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800',
    'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=1200',
    false, 'PUBLISHED', NOW(), NOW()
);

INSERT INTO chapters (course_id, title, description, order_index, estimated_duration, is_published, created_at, updated_at)
VALUES (5, 'English Sounds', 'Master all English vowel and consonant sounds', 1, 120, true, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    9, 'English Vowel Sounds', 'Learn to pronounce all English vowel sounds correctly',
    '<h2>English Vowel Sounds</h2><h3>Short Vowels</h3><ul><li><strong>/i/</strong> as in "sit, bit, hit"</li><li><strong>/e/</strong> as in "bed, red, said"</li><li><strong>/æ/</strong> as in "cat, hat, bad"</li><li><strong>/ʌ/</strong> as in "cup, but, love"</li><li><strong>/u/</strong> as in "book, good, put"</li></ul><h3>Long Vowels</h3><ul><li><strong>/i:/</strong> as in "see, tree, me"</li><li><strong>/a:/</strong> as in "car, far, start"</li><li><strong>/o:/</strong> as in "door, more, saw"</li><li><strong>/u:/</strong> as in "food, blue, true"</li></ul><h3>Diphthongs</h3><ul><li><strong>/ei/</strong> as in "day, make, say"</li><li><strong>/ai/</strong> as in "my, time, fly"</li><li><strong>/oi/</strong> as in "boy, coin, toy"</li></ul>',
    'VIDEO', 1, 20, true, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (14, 'English Vowel Sounds Tutorial', 'VIDEO', 'https://www.youtube.com/embed/p_8yK2kmxoo', 1, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    9, 'English Consonant Sounds', 'Master difficult English consonant sounds',
    '<h2>English Consonant Sounds</h2><h3>Difficult Consonant Sounds</h3><p><strong>TH Sounds:</strong></p><ul><li><strong>/th/</strong> (voiceless) as in "think, three, bath" - Put tongue between teeth, blow air</li><li><strong>/th/</strong> (voiced) as in "this, that, mother" - Same position, but use voice</li></ul><p><strong>R Sound /r/:</strong></p><ul><li>Examples: "red, right, very"</li><li>Tip: Curl tongue back slightly, don''t touch roof of mouth</li></ul><p><strong>L Sound /l/:</strong></p><ul><li><strong>Light L:</strong> Beginning of syllable - "light, love"</li><li><strong>Dark L:</strong> End of syllable - "ball, feel"</li></ul>',
    'VIDEO', 2, 22, false, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (15, 'English Consonant Sounds', 'VIDEO', 'https://www.youtube.com/embed/dfoRdKuPF9I', 1, NOW(), NOW());

INSERT INTO chapters (course_id, title, description, order_index, estimated_duration, is_published, created_at, updated_at)
VALUES (5, 'Stress and Intonation', 'Learn word stress, sentence stress, and intonation patterns', 2, 90, true, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    10, 'Word Stress Patterns', 'Master English word stress rules',
    '<h2>Word Stress in English</h2><h3>What is Word Stress?</h3><p>Word stress means saying one syllable louder, longer, and with higher pitch than others.</p><h3>Two-Syllable Words</h3><p><strong>Nouns and Adjectives:</strong> Usually stress first syllable</p><ul><li>TAble, HAPpy, PREtty, DOCtor</li></ul><p><strong>Verbs:</strong> Usually stress second syllable</p><ul><li>beGIN, forGET, reLAX, deCIDE</li></ul><h3>Suffixes and Stress</h3><p><strong>Stress before suffix:</strong></p><ul><li>-ic: ecoNOMic, geoGRAPHic</li><li>-tion: educaTION, informaTION</li><li>-sion: deciSION, televiSION</li></ul>',
    'VIDEO', 1, 18, false, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (16, 'Word Stress Rules', 'VIDEO', 'https://www.youtube.com/embed/nDaJqU33eQg', 1, NOW(), NOW());

INSERT INTO lessons (chapter_id, title, description, content, lesson_type, order_index, duration, is_preview, is_published, created_at, updated_at)
VALUES (
    10, 'Sentence Stress and Intonation', 'Learn natural English rhythm and melody',
    '<h2>Sentence Stress and Intonation</h2><h3>Sentence Stress</h3><p>In English, we stress <strong>content words</strong> (nouns, main verbs, adjectives, adverbs) and reduce <strong>function words</strong> (articles, prepositions, auxiliary verbs).</p><p><strong>Example:</strong> "I''m GOing to the STORE to buy some MILK."</p><h3>Intonation Patterns</h3><p><strong>Rising Intonation:</strong></p><ul><li>Yes/No questions: "Are you coming?"</li><li>Showing surprise: "Really?"</li></ul><p><strong>Falling Intonation:</strong></p><ul><li>Statements: "I live in London."</li><li>Wh-questions: "Where do you live?"</li><li>Commands: "Close the door."</li></ul>',
    'VIDEO', 2, 20, false, true, NOW(), NOW()
);

INSERT INTO lesson_media (lesson_id, title, media_type, url, position, created_at, updated_at)
VALUES (17, 'Sentence Stress and Intonation', 'VIDEO', 'https://www.youtube.com/embed/lZzu5jJTkzE', 1, NOW(), NOW());

-- End of seed data

