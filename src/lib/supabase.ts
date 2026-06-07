import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://peflkdkjytbuzmlmvtsk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZmxrZGtqeXRidXptbG12dHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzQ1NjksImV4cCI6MjA5NjQxMDU2OX0.PxKcVgl7jgnv--je5j-fesSorUdO17uP_vOxKJ6oh5U';

export const supabase = createClient(supabaseUrl, supabaseKey);
