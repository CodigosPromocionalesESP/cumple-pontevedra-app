import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
  const client = new Client({
    connectionString: 'postgresql://postgres:JjGAEaHYrQzU?32@db.peflkdkjytbuzmlmvtsk.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    await client.query('CREATE POLICY "Borrado público" ON public.cars FOR DELETE USING (true);');
    await client.end();
    return NextResponse.json({ success: true, message: 'Policy created' });
  } catch (error: any) {
    if (client) await client.end();
    return NextResponse.json({ success: false, error: error.message });
  }
}
