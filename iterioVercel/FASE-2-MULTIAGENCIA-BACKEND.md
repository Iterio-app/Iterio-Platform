# 🏢 Multi-agencia Backend - Plan completo

## 🎯 Objetivo
Implementar estructura completa de multi-agencia a nivel backend antes de Asset Gallery.

**Beneficios:**
- ✅ Evita migraciones complejas futuras
- ✅ Todo correctamente relacionado desde día 1
- ✅ RLS configurado correctamente
- ✅ Frontend puede implementarse después

---

## 📋 Pasos de implementación

### **PASO 1: Crear tabla `agencies`** ⏱️ 10 min

```sql
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agencies_owner ON agencies(owner_id);
CREATE INDEX idx_agencies_slug ON agencies(slug);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agencies"
ON agencies FOR SELECT TO authenticated
USING (id IN (SELECT agency_id FROM agency_members WHERE user_id = auth.uid()));
```

Ver archivo completo para todas las políticas y pasos detallados.

---

### **PASO 2: Crear tabla `agency_members`** ⏱️ 10 min

```sql
CREATE TABLE agency_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, user_id)
);
```

---

### **PASO 3-6: Migrar tablas existentes**

- Agregar `agency_id` a `quotes`, `templates`, `assets`
- Actualizar RLS policies
- Migrar datos existentes

---

### **PASO 7-9: Código TypeScript**

- Crear `lib/agency-helpers.ts`
- Crear `hooks/use-agency.ts`
- Actualizar hooks existentes

---

## ⏱️ Tiempo total: ~2 horas

Ver `FASE-2-MULTIAGENCIA-BACKEND.md` completo para todos los detalles.
