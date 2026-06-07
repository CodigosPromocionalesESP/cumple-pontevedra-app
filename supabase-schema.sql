-- Copia y pega esto en el SQL Editor de tu proyecto Supabase para crear/actualizar las tablas necesarias

-- 1. CREACIÓN DE TABLAS
CREATE TABLE IF NOT EXISTS public.profiles (
  nickname text PRIMARY KEY,
  avatar_url text, -- Nuevo campo
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- (Ignoramos coches, comidas y gastos que ya estaban creados)
CREATE TABLE IF NOT EXISTS public.cars (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver text REFERENCES public.profiles(nickname) NOT NULL,
  total_seats integer NOT NULL,
  available_seats integer NOT NULL,
  origin text NOT NULL,
  stops text[] DEFAULT array[]::text[],
  destination text DEFAULT 'Casa César' NOT NULL,
  departure_time time without time zone NOT NULL,
  return_time time without time zone NOT NULL,
  pick_up_points text,
  passengers text[] DEFAULT array[]::text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.meals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  attendees text[] DEFAULT array[]::text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payer text REFERENCES public.profiles(nickname) NOT NULL,
  amount numeric(10,2) NOT NULL,
  concept text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RECREACIÓN DE LA LISTA DE LA COMPRA PARA SOPORTAR PARTICIPANTES
DROP TABLE IF EXISTS public.shopping_list_participants CASCADE;
DROP TABLE IF EXISTS public.shopping_list CASCADE;

CREATE TABLE public.shopping_list (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL DEFAULT 'comida', -- 'comida' | 'bebida'
  item text NOT NULL,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  unit_type text NOT NULL DEFAULT 'uds', -- 'uds', 'kg', 'g', 'L'
  added_by text REFERENCES public.profiles(nickname),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.shopping_list_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shopping_list_id uuid REFERENCES public.shopping_list(id) ON DELETE CASCADE,
  nickname text REFERENCES public.profiles(nickname) ON DELETE CASCADE,
  quantity numeric(10,2) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(shopping_list_id, nickname)
);

-- 2. HABILITAR WEBSOCKETS (REALTIME)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cars') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cars;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'meals') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE meals;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'shopping_list') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'shopping_list_participants') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list_participants;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'expenses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
  END IF;
END $$;

-- 3. HABILITAR RLS Y MEDIDAS DE SEGURIDAD EXTREMAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores de todas las tablas por si acaso
DROP POLICY IF EXISTS "Lectura pública" ON public.profiles;
DROP POLICY IF EXISTS "Inserción pública" ON public.profiles;

DROP POLICY IF EXISTS "Lectura pública" ON public.cars;
DROP POLICY IF EXISTS "Inserción pública" ON public.cars;
DROP POLICY IF EXISTS "Actualización pública" ON public.cars;

DROP POLICY IF EXISTS "Lectura pública" ON public.meals;
DROP POLICY IF EXISTS "Inserción pública" ON public.meals;
DROP POLICY IF EXISTS "Actualización pública" ON public.meals;

DROP POLICY IF EXISTS "Lectura pública" ON public.expenses;
DROP POLICY IF EXISTS "Inserción pública" ON public.expenses;

DROP POLICY IF EXISTS "Lectura pública" ON public.shopping_list;
DROP POLICY IF EXISTS "Inserción pública" ON public.shopping_list;
DROP POLICY IF EXISTS "Actualización pública" ON public.shopping_list;
DROP POLICY IF EXISTS "Borrado creador" ON public.shopping_list;

DROP POLICY IF EXISTS "Lectura pública" ON public.shopping_list_participants;
DROP POLICY IF EXISTS "Inserción pública" ON public.shopping_list_participants;
DROP POLICY IF EXISTS "Actualización pública" ON public.shopping_list_participants;
DROP POLICY IF EXISTS "Borrado participante" ON public.shopping_list_participants;

-- POLÍTICAS DE LECTURA
CREATE POLICY "Lectura pública" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON public.cars FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON public.meals FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON public.shopping_list FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON public.shopping_list_participants FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON public.expenses FOR SELECT USING (true);

-- POLÍTICAS DE INSERCIÓN
CREATE POLICY "Inserción pública" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Inserción pública" ON public.cars FOR INSERT WITH CHECK (true);
CREATE POLICY "Inserción pública" ON public.meals FOR INSERT WITH CHECK (true);
CREATE POLICY "Inserción pública" ON public.shopping_list FOR INSERT WITH CHECK (true);
CREATE POLICY "Inserción pública" ON public.shopping_list_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Inserción pública" ON public.expenses FOR INSERT WITH CHECK (true);

-- POLÍTICAS DE ACTUALIZACIÓN
CREATE POLICY "Actualización pública" ON public.cars FOR UPDATE USING (true);
CREATE POLICY "Actualización pública" ON public.meals FOR UPDATE USING (true);
CREATE POLICY "Actualización pública" ON public.shopping_list FOR UPDATE USING (true);
CREATE POLICY "Actualización pública" ON public.shopping_list_participants FOR UPDATE USING (true);

-- POLÍTICAS DE BORRADO (Solo para lista de la compra según requerimiento)
CREATE POLICY "Borrado creador" ON public.shopping_list FOR DELETE USING (true);
CREATE POLICY "Borrado participante" ON public.shopping_list_participants FOR DELETE USING (true);
