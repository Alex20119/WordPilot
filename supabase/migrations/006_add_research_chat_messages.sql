-- Create research_chat_messages table
CREATE TABLE IF NOT EXISTS research_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_research_chat_messages_project_id ON research_chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_research_chat_messages_phase ON research_chat_messages(phase);
CREATE INDEX IF NOT EXISTS idx_research_chat_messages_created_at ON research_chat_messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE research_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view their own chat messages
CREATE POLICY "Users can view own chat messages"
  ON research_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = research_chat_messages.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy: Users can insert their own chat messages
CREATE POLICY "Users can insert own chat messages"
  ON research_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = research_chat_messages.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy: Users can delete their own chat messages
CREATE POLICY "Users can delete own chat messages"
  ON research_chat_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = research_chat_messages.project_id 
      AND projects.user_id = auth.uid()
    )
  );
