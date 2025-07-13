-- Tabla de templates de usuario
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  template_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índice para búsquedas rápidas por usuario
create index idx_templates_user_id on public.templates(user_id);

-- Habilitar RLS
alter table public.templates enable row level security;

-- Políticas de seguridad: solo el dueño puede ver, insertar, actualizar y borrar sus templates
create policy "Templates: usuario puede ver sus templates" on public.templates
  for select using (auth.uid() = user_id);

create policy "Templates: usuario puede insertar" on public.templates
  for insert with check (auth.uid() = user_id);

create policy "Templates: usuario puede actualizar" on public.templates
  for update using (auth.uid() = user_id);

create policy "Templates: usuario puede borrar" on public.templates
  for delete using (auth.uid() = user_id);

-- (Opcional) Trigger para actualizar updated_at automáticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_template_updated_at
before update on public.templates
for each row
execute procedure update_updated_at_column(); 