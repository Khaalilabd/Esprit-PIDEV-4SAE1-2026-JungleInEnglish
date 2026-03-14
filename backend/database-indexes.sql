-- ============================================
-- DATABASE INDEXES OPTIMIZATION
-- EnglishFlow Platform
-- ============================================
-- This script adds indexes to improve query performance
-- Run this on your PostgreSQL databases

-- ============================================
-- AUTH SERVICE DATABASE (englishflow_identity)
-- ============================================

\c englishflow_identity;

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Invitations indexes
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Activation tokens indexes
CREATE INDEX IF NOT EXISTS idx_activation_tokens_user_id ON activation_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_tokens_token ON activation_tokens(token);

-- ============================================
-- COURSES SERVICE DATABASE (englishflow_courses)
-- ============================================

\c englishflow_courses;

-- Courses table indexes
CREATE INDEX IF NOT EXISTS idx_courses_tutor_id ON courses(tutor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_is_featured ON courses(is_featured);

-- Course categories indexes
CREATE INDEX IF NOT EXISTS idx_course_categories_active ON course_categories(active);
CREATE INDEX IF NOT EXISTS idx_course_categories_display_order ON course_categories(display_order);

-- Course enrollments indexes
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(status);

-- Chapters indexes
CREATE INDEX IF NOT EXISTS idx_chapters_course_id ON chapters(course_id);
CREATE INDEX IF NOT EXISTS idx_chapters_order_index ON chapters(order_index);

-- Lessons indexes
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_id ON lessons(chapter_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_type ON lessons(lesson_type);

-- Lesson progress indexes
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student_id ON lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(completed);

-- Chapter progress indexes
CREATE INDEX IF NOT EXISTS idx_chapter_progress_student_id ON chapter_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_chapter_id ON chapter_progress(chapter_id);

-- Packs indexes
CREATE INDEX IF NOT EXISTS idx_packs_status ON packs(status);
CREATE INDEX IF NOT EXISTS idx_packs_created_at ON packs(created_at DESC);

-- Pack enrollments indexes
CREATE INDEX IF NOT EXISTS idx_pack_enrollments_student_id ON pack_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_pack_enrollments_pack_id ON pack_enrollments(pack_id);

-- Tutor availability indexes
CREATE INDEX IF NOT EXISTS idx_tutor_availability_tutor_id ON tutor_availability(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_availability_day_of_week ON tutor_availability(day_of_week);

-- ============================================
-- EXAM SERVICE DATABASE (englishflow_exams)
-- ============================================

\c englishflow_exams;

-- Exams indexes
CREATE INDEX IF NOT EXISTS idx_exams_level ON exams(level);
CREATE INDEX IF NOT EXISTS idx_exams_created_at ON exams(created_at DESC);

-- Parts indexes
CREATE INDEX IF NOT EXISTS idx_parts_exam_id ON parts(exam_id);
CREATE INDEX IF NOT EXISTS idx_parts_order_index ON parts(order_index);

-- Questions indexes
CREATE INDEX IF NOT EXISTS idx_questions_part_id ON questions(part_id);
CREATE INDEX IF NOT EXISTS idx_questions_question_type ON questions(question_type);

-- Student exam attempts indexes
CREATE INDEX IF NOT EXISTS idx_student_exam_attempts_user_id ON student_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_attempts_exam_id ON student_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_attempts_status ON student_exam_attempts(status);
CREATE INDEX IF NOT EXISTS idx_student_exam_attempts_started_at ON student_exam_attempts(started_at DESC);

-- Student answers indexes
CREATE INDEX IF NOT EXISTS idx_student_answers_attempt_id ON student_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_question_id ON student_answers(question_id);

-- Exam results indexes
CREATE INDEX IF NOT EXISTS idx_exam_results_user_id ON exam_results(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_attempt_id ON exam_results(attempt_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_level ON exam_results(level);
CREATE INDEX IF NOT EXISTS idx_exam_results_created_at ON exam_results(created_at DESC);

-- Grading queue indexes
CREATE INDEX IF NOT EXISTS idx_grading_queue_attempt_id ON grading_queue(attempt_id);
CREATE INDEX IF NOT EXISTS idx_grading_queue_status ON grading_queue(status);
CREATE INDEX IF NOT EXISTS idx_grading_queue_priority ON grading_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_grading_queue_created_at ON grading_queue(created_at);

-- ============================================
-- COMMUNITY SERVICE DATABASE (englishflow_community)
-- ============================================

\c englishflow_community;

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_is_locked ON categories(is_locked);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Subcategories indexes
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_is_locked ON subcategories(is_locked);
CREATE INDEX IF NOT EXISTS idx_subcategories_display_order ON subcategories(display_order);

-- Topics indexes
CREATE INDEX IF NOT EXISTS idx_topics_sub_category_id ON topics(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_topics_author_id ON topics(author_id);
CREATE INDEX IF NOT EXISTS idx_topics_created_at ON topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topics_is_pinned ON topics(is_pinned);
CREATE INDEX IF NOT EXISTS idx_topics_is_locked ON topics(is_locked);
CREATE INDEX IF NOT EXISTS idx_topics_is_trending ON topics(is_trending);
CREATE INDEX IF NOT EXISTS idx_topics_view_count ON topics(view_count DESC);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_topic_id ON posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_trending ON posts(is_trending);
CREATE INDEX IF NOT EXISTS idx_posts_helpful_count ON posts(helpful_count DESC);

-- Post reactions indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);

-- ============================================
-- MESSAGING SERVICE DATABASE (englishflow_messaging_db)
-- ============================================

\c englishflow_messaging_db;

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Conversation participants indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- ============================================
-- CLUB SERVICE DATABASE (englishflow_jungle_club_db)
-- ============================================

\c englishflow_jungle_club_db;

-- Clubs indexes
CREATE INDEX IF NOT EXISTS idx_clubs_created_at ON clubs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clubs_is_active ON clubs(is_active);

-- Club members indexes
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_role ON club_members(role);
CREATE INDEX IF NOT EXISTS idx_club_members_joined_at ON club_members(joined_at DESC);

-- Club events indexes
CREATE INDEX IF NOT EXISTS idx_club_events_club_id ON club_events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_events_event_date ON club_events(event_date);
CREATE INDEX IF NOT EXISTS idx_club_events_created_at ON club_events(created_at DESC);

-- ============================================
-- COMPOSITE INDEXES (for complex queries)
-- ============================================

\c englishflow_identity;
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, active);

\c englishflow_courses;
CREATE INDEX IF NOT EXISTS idx_courses_status_level ON courses(status, level);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student_status ON course_enrollments(student_id, status);

\c englishflow_exams;
CREATE INDEX IF NOT EXISTS idx_student_exam_attempts_user_status ON student_exam_attempts(user_id, status);

\c englishflow_community;
CREATE INDEX IF NOT EXISTS idx_topics_subcategory_created ON topics(sub_category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_topic_created ON posts(topic_id, created_at DESC);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify indexes were created

\c englishflow_identity;
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

\c englishflow_courses;
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

\c englishflow_exams;
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

\c englishflow_community;
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

\c englishflow_messaging_db;
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

\c englishflow_jungle_club_db;
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- Additional databases
\c englishflow_gamification;
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

\c englishflow_complaints;
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

\c englishflow_learning_db;
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
