-- Create the lens_workspaces table
CREATE TABLE lens_workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_data JSONB NOT NULL, -- Store your entire workspace object here
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Create an index for faster user queries
CREATE INDEX lens_workspaces_user_id_idx ON lens_workspaces(user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to use the function
CREATE TRIGGER update_lens_workspaces_updated_at
BEFORE UPDATE ON lens_workspaces
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create security policies for row-level security

-- 1. Users can view their own workspaces
CREATE POLICY "Users can view their own workspaces"
  ON lens_workspaces
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Users can insert their own workspaces
CREATE POLICY "Users can insert their own workspaces"
  ON lens_workspaces
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own workspaces
CREATE POLICY "Users can update their own workspaces"
  ON lens_workspaces
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Users can delete their own workspaces
CREATE POLICY "Users can delete their own workspaces"
  ON lens_workspaces
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Row Level Security
ALTER TABLE lens_workspaces ENABLE ROW LEVEL SECURITY;

-- Comment on table for documentation
COMMENT ON TABLE lens_workspaces IS 'Stores LogitLens workspaces with their completions, graph data, and annotations in a JSONB field';