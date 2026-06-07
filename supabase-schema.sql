-- Copia y pega esto en el SQL Editor de tu proyecto Supabase para crear las tablas necesarias

-- Tabla de Usuarios/Perfiles
CREATE TABLE public.profiles (
  nickname text PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Coches
CREATE TABLE public.cars (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  driver text REFERENCES public.profiles(nickname) NOT NULL,
  total_seats integer NOT NULL,
  available_seats integer NOT NULL,
  origin text NOT NULL,
  destination text DEFAULT 'Pontevedra' NOT NULL,
  departure_time time without time zone NOT NULL,
  return_time time without time zone NOT NULL,
  pick_up_points text,
  passengers text[] DEFAULT array[]::text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Plan de Comidas
CREATE TABLE public.meals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  attendees text[] DEFAULT array[]::text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Lista de la Compra
CREATE TABLE public.shopping_list (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item text NOT NULL,
  checked boolean DEFAULT false NOT NULL,
  added_by text REFERENCES public.profiles(nickname),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Gastos
CREATE TABLE public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payer text REFERENCES public.profiles(nickname) NOT NULL,
  amount numeric(10,2) NOT NULL,
  concept text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Realtime para todas las tablas
ALTER PUBLICATION supabase_realtime ADD TABLE cars;
ALTER PUBLICATION supabase_realtime ADD TABLE meals;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;

-- (Opcional) Políticas RLS - Para este proyecto interno podríamos dejarlas públicas o crear políticas básicas
-- Por simplicidad en un proyecto de amigos de fin de semana, podrías deshabilitar RLS o hacer todo público:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE cars DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE meals DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE shopping_list DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
