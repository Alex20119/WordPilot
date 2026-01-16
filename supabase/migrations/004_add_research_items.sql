-- Create research_items table
CREATE TABLE IF NOT EXISTS research_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  name TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_research_items_project_id ON research_items(project_id);
CREATE INDEX IF NOT EXISTS idx_research_items_section ON research_items(section);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_research_items_updated_at 
  BEFORE UPDATE ON research_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own research
CREATE POLICY "Users can view their own research"
  ON research_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = research_items.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy: Users can insert their own research
CREATE POLICY "Users can insert their own research"
  ON research_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = research_items.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy: Users can update their own research
CREATE POLICY "Users can update their own research"
  ON research_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = research_items.project_id 
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = research_items.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy: Users can delete their own research
CREATE POLICY "Users can delete their own research"
  ON research_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = research_items.project_id 
      AND projects.user_id = auth.uid()
    )
  );
