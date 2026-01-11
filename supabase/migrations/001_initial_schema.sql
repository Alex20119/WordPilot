-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sandwiches table
CREATE TABLE sandwiches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter INTEGER NOT NULL CHECK (chapter >= 1 AND chapter <= 8),
  name TEXT NOT NULL,
  origin TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  significance TEXT NOT NULL,
  fun_facts TEXT NOT NULL,
  researched BOOLEAN NOT NULL DEFAULT false,
  writing_status TEXT NOT NULL DEFAULT 'not_started' 
    CHECK (writing_status IN ('not_started', 'drafted', 'revised', 'final')),
  personal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index for faster chapter-based queries
CREATE INDEX idx_sandwiches_chapter ON sandwiches(chapter);

-- Create index for faster status-based queries
CREATE INDEX idx_sandwiches_writing_status ON sandwiches(writing_status);

-- Create index for full-text search on name, ingredients, and origin
CREATE INDEX idx_sandwiches_search ON sandwiches USING gin(
  to_tsvector('english', name || ' ' || ingredients || ' ' || origin)
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sandwiches_updated_at 
  BEFORE UPDATE ON sandwiches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE sandwiches ENABLE ROW LEVEL SECURITY;

-- Create policy: Authenticated users can read all sandwiches
CREATE POLICY "Authenticated users can read sandwiches"
  ON sandwiches FOR SELECT
  TO authenticated
  USING (true);

-- Create policy: Authenticated users can insert sandwiches
CREATE POLICY "Authenticated users can insert sandwiches"
  ON sandwiches FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy: Authenticated users can update sandwiches
CREATE POLICY "Authenticated users can update sandwiches"
  ON sandwiches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy: Authenticated users can delete sandwiches
CREATE POLICY "Authenticated users can delete sandwiches"
  ON sandwiches FOR DELETE
  TO authenticated
  USING (true);