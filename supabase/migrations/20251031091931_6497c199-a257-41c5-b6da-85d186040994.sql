-- Enable RLS on all tables
ALTER TABLE vocab ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_summary ENABLE ROW LEVEL SECURITY;

-- Create public access policies for MVP (no auth required)
-- Vocab policies
CREATE POLICY "Public read vocab" ON vocab FOR SELECT USING (true);
CREATE POLICY "Public insert vocab" ON vocab FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update vocab" ON vocab FOR UPDATE USING (true);
CREATE POLICY "Public delete vocab" ON vocab FOR DELETE USING (true);

-- Attempts policies
CREATE POLICY "Public read attempts" ON attempts FOR SELECT USING (true);
CREATE POLICY "Public insert attempts" ON attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update attempts" ON attempts FOR UPDATE USING (true);
CREATE POLICY "Public delete attempts" ON attempts FOR DELETE USING (true);

-- Progress policies
CREATE POLICY "Public read progress" ON progress FOR SELECT USING (true);
CREATE POLICY "Public insert progress" ON progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update progress" ON progress FOR UPDATE USING (true);
CREATE POLICY "Public delete progress" ON progress FOR DELETE USING (true);

-- Dashboard summary policies
CREATE POLICY "Public read dashboard" ON dashboard_summary FOR SELECT USING (true);
CREATE POLICY "Public insert dashboard" ON dashboard_summary FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update dashboard" ON dashboard_summary FOR UPDATE USING (true);
CREATE POLICY "Public delete dashboard" ON dashboard_summary FOR DELETE USING (true);