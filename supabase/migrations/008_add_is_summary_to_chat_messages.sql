-- Add is_summary column for rolling summarization
ALTER TABLE research_chat_messages
ADD COLUMN IF NOT EXISTS is_summary BOOLEAN DEFAULT false;
