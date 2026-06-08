-- =================================================================
-- BLOK — Supabase SQL Migration
-- Full schema: tables, enums, constraints, RLS policies
-- =================================================================

-- -----------------------------------------------------------------
-- CLEAN UP (If running again)
-- -----------------------------------------------------------------

DROP TABLE IF EXISTS ratings, escrow, messages, task_price_history, tasks, users CASCADE;
DROP TYPE IF EXISTS task_category, task_pricing_type, task_state CASCADE;

-- -----------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------


CREATE TYPE task_category AS ENUM (
  'Errand',
  'Delivery',
  'Academic Support',
  'Queue Stander',
  'Moving Help',
  'Other'
);

CREATE TYPE task_pricing_type AS ENUM (
  'Flat Reward',
  'Variable Reimbursement + Reward'
);

CREATE TYPE task_state AS ENUM (
  'Draft',
  'Published',
  'Accepted',
  'In-Progress',
  'Completed',
  'Expired',
  'Disputed',
  'Archived'
);

-- -----------------------------------------------------------------
-- TABLE: users
-- -----------------------------------------------------------------

CREATE TABLE users (
  user_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE NOT NULL,
  full_name         TEXT NOT NULL,
  institution_email TEXT UNIQUE NOT NULL,
  student_id_photo  TEXT,
  sso_token         TEXT,
  campus_id         TEXT NOT NULL,
  hostel_block      TEXT,
  room_number       TEXT,
  trust_score       NUMERIC(3,1) NOT NULL DEFAULT 5.0
                    CHECK (trust_score >= 1.0 AND trust_score <= 5.0),
  wallet_balance    NUMERIC(10,2) NOT NULL DEFAULT 0.00
                    CHECK (wallet_balance >= 0),
  penalty_agreement BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_agreement BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_done   BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------
-- TABLE: tasks
-- -----------------------------------------------------------------

CREATE TABLE tasks (
  task_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id          UUID NOT NULL REFERENCES users(user_id),
  performer_id       UUID REFERENCES users(user_id),
  title              TEXT NOT NULL CHECK (char_length(title) <= 60),
  description        TEXT NOT NULL,
  category           task_category NOT NULL,
  pricing_type       task_pricing_type NOT NULL,
  reward_amount      NUMERIC(10,2) NOT NULL CHECK (reward_amount >= 0),
  campus_id          TEXT NOT NULL,
  base_block         TEXT NOT NULL,
  target_block       TEXT NOT NULL,
  is_remote          BOOLEAN NOT NULL DEFAULT FALSE,
  completion_passcode TEXT,
  proof_photo_url    TEXT,
  task_state         task_state NOT NULL DEFAULT 'Draft',
  expires_at         TIMESTAMPTZ NOT NULL,
  deadline_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted         BOOLEAN NOT NULL DEFAULT FALSE
);

-- -----------------------------------------------------------------
-- TABLE: escrow
-- -----------------------------------------------------------------

CREATE TABLE escrow (
  escrow_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID UNIQUE NOT NULL REFERENCES tasks(task_id),
  poster_id    UUID NOT NULL REFERENCES users(user_id),
  performer_id UUID REFERENCES users(user_id),
  amount       NUMERIC(10,2) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'held'
               CHECK (status IN ('held', 'released', 'penalised', 'refunded')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);

-- -----------------------------------------------------------------
-- TABLE: ratings
-- -----------------------------------------------------------------

CREATE TABLE ratings (
  rating_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(task_id),
  rater_id      UUID NOT NULL REFERENCES users(user_id),
  rated_id      UUID NOT NULL REFERENCES users(user_id),
  reliability   SMALLINT NOT NULL CHECK (reliability BETWEEN 1 AND 5),
  communication SMALLINT NOT NULL CHECK (communication BETWEEN 1 AND 5),
  timeliness    SMALLINT NOT NULL CHECK (timeliness BETWEEN 1 AND 5),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, rater_id, rated_id)
);

-- -----------------------------------------------------------------
-- TABLE: messages
-- -----------------------------------------------------------------

CREATE TABLE messages (
  message_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(task_id),
  sender_id   UUID NOT NULL REFERENCES users(user_id),
  receiver_id UUID NOT NULL REFERENCES users(user_id),
  body        TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------
-- TABLE: task_price_history
-- -----------------------------------------------------------------

CREATE TABLE task_price_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id     TEXT NOT NULL,
  base_block    TEXT NOT NULL,
  target_block  TEXT NOT NULL,
  category      task_category NOT NULL,
  reward_amount NUMERIC(10,2) NOT NULL,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =================================================================
-- ROW-LEVEL SECURITY
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_price_history ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------
-- RLS POLICIES: users
-- -----------------------------------------------------------------

-- Users can only read their own row
CREATE POLICY "users_select_own"
  ON users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own row
CREATE POLICY "users_update_own"
  ON users
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow insert during registration (service key bypasses RLS,
-- but this policy allows anon/authenticated inserts if needed)
CREATE POLICY "users_insert"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------
-- RLS POLICIES: tasks
-- -----------------------------------------------------------------

-- Users can see published tasks on their campus (feed),
-- plus any task where they are poster or performer
CREATE POLICY "tasks_select_feed_or_own"
  ON tasks
  FOR SELECT
  USING (
    (
      task_state = 'Published'
      AND is_deleted = FALSE
      AND campus_id IN (
        SELECT campus_id FROM users WHERE user_id = auth.uid()
      )
    )
    OR poster_id = auth.uid()
    OR performer_id = auth.uid()
  );

-- Only the poster can insert tasks
CREATE POLICY "tasks_insert_poster"
  ON tasks
  FOR INSERT
  WITH CHECK (poster_id = auth.uid());

-- Poster or performer can update tasks (state transitions)
CREATE POLICY "tasks_update_involved"
  ON tasks
  FOR UPDATE
  USING (poster_id = auth.uid() OR performer_id = auth.uid())
  WITH CHECK (poster_id = auth.uid() OR performer_id = auth.uid());

-- -----------------------------------------------------------------
-- RLS POLICIES: escrow
-- -----------------------------------------------------------------

-- Only poster or performer on the associated task can read escrow
CREATE POLICY "escrow_select_involved"
  ON escrow
  FOR SELECT
  USING (
    poster_id = auth.uid()
    OR performer_id = auth.uid()
  );

-- Poster can insert escrow (created when task is posted)
CREATE POLICY "escrow_insert_poster"
  ON escrow
  FOR INSERT
  WITH CHECK (poster_id = auth.uid());

-- Poster or performer can trigger escrow updates (release, refund, penalty)
CREATE POLICY "escrow_update_involved"
  ON escrow
  FOR UPDATE
  USING (poster_id = auth.uid() OR performer_id = auth.uid())
  WITH CHECK (poster_id = auth.uid() OR performer_id = auth.uid());

-- -----------------------------------------------------------------
-- RLS POLICIES: ratings
-- -----------------------------------------------------------------

-- Anyone involved in the task can read ratings
CREATE POLICY "ratings_select_involved"
  ON ratings
  FOR SELECT
  USING (
    rater_id = auth.uid()
    OR rated_id = auth.uid()
  );

-- Insert rating only if you are poster or performer on the task,
-- and the unique constraint (task_id, rater_id, rated_id) prevents duplicates
CREATE POLICY "ratings_insert_involved"
  ON ratings
  FOR INSERT
  WITH CHECK (
    rater_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.task_id = ratings.task_id
      AND (tasks.poster_id = auth.uid() OR tasks.performer_id = auth.uid())
    )
  );

-- -----------------------------------------------------------------
-- RLS POLICIES: messages
-- -----------------------------------------------------------------

-- Only sender or receiver can read messages
CREATE POLICY "messages_select_involved"
  ON messages
  FOR SELECT
  USING (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
  );

-- Only authenticated sender can insert messages
CREATE POLICY "messages_insert_sender"
  ON messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Receiver can mark messages as read
CREATE POLICY "messages_update_receiver"
  ON messages
  FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- -----------------------------------------------------------------
-- RLS POLICIES: task_price_history
-- -----------------------------------------------------------------

-- Any authenticated user can read price history (for advisory)
CREATE POLICY "price_history_select_authenticated"
  ON task_price_history
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated users can insert price history entries
CREATE POLICY "price_history_insert_authenticated"
  ON task_price_history
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =================================================================
-- INDEXES for performance
-- =================================================================

CREATE INDEX idx_tasks_campus_state ON tasks(campus_id, task_state) WHERE is_deleted = FALSE;
CREATE INDEX idx_tasks_poster ON tasks(poster_id);
CREATE INDEX idx_tasks_performer ON tasks(performer_id);
CREATE INDEX idx_tasks_expires ON tasks(expires_at) WHERE task_state = 'Published';
CREATE INDEX idx_escrow_task ON escrow(task_id);
CREATE INDEX idx_ratings_rated ON ratings(rated_id);
CREATE INDEX idx_messages_task ON messages(task_id);
CREATE INDEX idx_price_history_lookup ON task_price_history(campus_id, base_block, target_block, category);
