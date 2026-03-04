-- Create ENUM types
CREATE TYPE exam_level AS ENUM ('A1','A2','B1','B2','C1','C2');
CREATE TYPE part_type AS ENUM ('VOCABULARY','GRAMMAR','READING','LISTENING',
  'WRITING','WORD_ORDERING','FILL_IN_GAP','MATCHING','MULTIPLE_CHOICE');
CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE','FILL_IN_GAP','WORD_ORDERING',
  'OPEN_WRITING','MATCHING','TRUE_FALSE','DROPDOWN_SELECT','AUDIO_RESPONSE');
CREATE TYPE attempt_status AS ENUM ('STARTED','SUBMITTED','GRADED','EXPIRED');
CREATE TYPE grading_mode AS ENUM ('AUTO','MANUAL','HYBRID');

-- Exams table
CREATE TABLE exams (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  level exam_level NOT NULL,
  description TEXT,
  total_duration INT NOT NULL DEFAULT 90,
  passing_score DECIMAL(5,2) NOT NULL DEFAULT 60.0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Exam parts table
CREATE TABLE exam_parts (
  id VARCHAR(36) PRIMARY KEY,
  exam_id VARCHAR(36) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  part_type part_type NOT NULL,
  instructions TEXT,
  order_index INT NOT NULL DEFAULT 0,
  time_limit INT,
  audio_url VARCHAR(500),
  reading_text TEXT
);

-- Questions table
CREATE TABLE questions (
  id VARCHAR(36) PRIMARY KEY,
  part_id VARCHAR(36) NOT NULL REFERENCES exam_parts(id) ON DELETE CASCADE,
  question_type question_type NOT NULL,
  prompt TEXT NOT NULL,
  media_url VARCHAR(500),
  order_index INT NOT NULL DEFAULT 0,
  points DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  explanation TEXT,
  metadata JSONB
);

-- Question options table
CREATE TABLE question_options (
  id VARCHAR(36) PRIMARY KEY,
  question_id VARCHAR(36) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

-- Correct answers table
CREATE TABLE correct_answers (
  id VARCHAR(36) PRIMARY KEY,
  question_id VARCHAR(36) NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
  answer_data JSONB NOT NULL
);

-- Student exam attempts table
CREATE TABLE student_exam_attempts (
  id VARCHAR(36) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  exam_id VARCHAR(36) NOT NULL REFERENCES exams(id),
  started_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  status attempt_status NOT NULL DEFAULT 'STARTED',
  total_score DECIMAL(8,2),
  percentage_score DECIMAL(5,2),
  passed BOOLEAN,
  time_spent INT,
  grading_mode grading_mode NOT NULL DEFAULT 'HYBRID'
);

-- Student answers table
CREATE TABLE student_answers (
  id VARCHAR(36) PRIMARY KEY,
  attempt_id VARCHAR(36) NOT NULL REFERENCES student_exam_attempts(id) ON DELETE CASCADE,
  question_id VARCHAR(36) NOT NULL REFERENCES questions(id),
  answer_data JSONB,
  is_correct BOOLEAN,
  score DECIMAL(5,2),
  manual_feedback TEXT,
  graded_at TIMESTAMP,
  graded_by BIGINT
);

-- Exam results table
CREATE TABLE exam_results (
  id VARCHAR(36) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  attempt_id VARCHAR(36) NOT NULL UNIQUE REFERENCES student_exam_attempts(id),
  level exam_level NOT NULL,
  total_score DECIMAL(8,2) NOT NULL,
  percentage_score DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  part_breakdown JSONB NOT NULL,
  cefr_band exam_level,
  certificate VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_exam_level_published  ON exams(level, is_published);
CREATE INDEX idx_attempt_user_exam     ON student_exam_attempts(user_id, exam_id);
CREATE INDEX idx_attempt_status        ON student_exam_attempts(status);
CREATE INDEX idx_answers_attempt       ON student_answers(attempt_id);
CREATE INDEX idx_results_user          ON exam_results(user_id);
CREATE INDEX idx_exam_parts_exam       ON exam_parts(exam_id);
CREATE INDEX idx_questions_part        ON questions(part_id);
CREATE INDEX idx_options_question      ON question_options(question_id);
