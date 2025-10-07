-- ========================================
-- CallOps Tracker Schema
-- Version: 1.0
-- Date: 2025-10-07
-- Timezone: Europe/Madrid
-- ========================================

-- Drop existing tables if they exist (in reverse order due to dependencies)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS changes_checklist CASCADE;
DROP TABLE IF EXISTS test_metrics CASCADE;
DROP TABLE IF EXISTS tests CASCADE;

-- ========================================
-- Table: tests
-- Main table for test experiments
-- ========================================
CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_key TEXT UNIQUE NOT NULL, -- T-003
    code TEXT NOT NULL, -- FM, etc.
    full_id TEXT UNIQUE NOT NULL, -- T-003-FM-2025-10-07
    name TEXT NOT NULL,
    alternative_name TEXT,
    hypothesis TEXT NOT NULL,
    objective TEXT NOT NULL,
    design TEXT NOT NULL,
    variants JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{"id":"A","label":"Móvil"},{"id":"B","label":"Fijo"}]
    sample_per_variant JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"A": 100, "B": 100}
    duration_hours INTEGER NOT NULL DEFAULT 24,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Running', 'ToReport', 'Finished', 'Canceled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_test_key TEXT, -- For iterations
    iteration_index INTEGER DEFAULT 0, -- 0 for base test, 1+ for iterations
    success_criteria TEXT NOT NULL,
    live_safe_fields JSONB DEFAULT '{}'::jsonb,
    
    -- Test configuration
    independent_variable TEXT NOT NULL,
    dependent_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    planned_start_date DATE,
    channels JSONB DEFAULT '[]'::jsonb, -- ["Phone", "WhatsApp", "Email"]
    operational_notes TEXT,
    
    -- Phone numbers used in test
    phone_numbers_used JSONB DEFAULT '[]'::jsonb, -- [{"id": "uuid", "number": "+34..."}]
    
    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_tests_test_key ON tests(test_key);
CREATE INDEX idx_tests_status ON tests(status);
CREATE INDEX idx_tests_owner ON tests(owner_user_id);
CREATE INDEX idx_tests_parent ON tests(parent_test_key);
CREATE INDEX idx_tests_created_at ON tests(created_at DESC);

-- ========================================
-- Table: test_metrics
-- Metrics for each test variant
-- ========================================
CREATE TABLE test_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_key TEXT NOT NULL,
    iteration_index INTEGER NOT NULL DEFAULT 0,
    variant_id TEXT NOT NULL, -- A, B, C, etc.
    
    -- Base metrics (input data)
    llamadas_realizadas INTEGER NOT NULL DEFAULT 0,
    llamadas_contestadas INTEGER NOT NULL DEFAULT 0,
    leads_llamados INTEGER NOT NULL DEFAULT 0,
    leads_con_respuesta INTEGER NOT NULL DEFAULT 0,
    intentos_hasta_respuesta_promedio DECIMAL(10,2) DEFAULT 0,
    llamadas_colgadas INTEGER NOT NULL DEFAULT 0,
    duracion_total_contestadas_min DECIMAL(10,2) DEFAULT 0,
    numeros_totales INTEGER NOT NULL DEFAULT 0,
    numeros_con_spam INTEGER NOT NULL DEFAULT 0,
    vms_dejados INTEGER NOT NULL DEFAULT 0,
    callbacks_en_2h INTEGER NOT NULL DEFAULT 0,
    callbacks_en_24h INTEGER NOT NULL DEFAULT 0,
    c_ans_eur DECIMAL(10,2) DEFAULT 0,
    c_min_eur DECIMAL(10,4) DEFAULT 0,
    ttfa_median_min DECIMAL(10,2),
    
    -- Calculated KPIs
    pct_llamadas_respondidas DECIMAL(10,2),
    pct_leads_que_contestaron DECIMAL(10,2),
    pct_colgadas_por_lead DECIMAL(10,2),
    duracion_media_min DECIMAL(10,2),
    spam_rate DECIMAL(10,2),
    callback_rate_2h DECIMAL(10,2),
    callback_rate_24h DECIMAL(10,2),
    clr DECIMAL(10,2),
    
    -- Metadata
    data_source TEXT DEFAULT 'Manual' CHECK (data_source IN ('Manual', 'CSV', 'API')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(test_key, iteration_index, variant_id)
);

-- Create indexes
CREATE INDEX idx_test_metrics_test_key ON test_metrics(test_key);
CREATE INDEX idx_test_metrics_variant ON test_metrics(variant_id);

-- ========================================
-- Table: changes_checklist
-- Track changes between iterations
-- ========================================
CREATE TABLE changes_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_key TEXT NOT NULL,
    iteration_index INTEGER NOT NULL,
    item TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Guion', 'Horario', 'Timbrado', 'Routing', 'Segmentación', 
        'VM', 'Costes', 'Sistema', 'Variantes', 'Tamaño', 'Enmascaramiento', 'Otros'
    )),
    semaforo TEXT NOT NULL DEFAULT 'Gris' CHECK (semaforo IN ('Verde', 'Naranja', 'Rojo', 'Gris')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_changes_test_key ON changes_checklist(test_key);
CREATE INDEX idx_changes_iteration ON changes_checklist(iteration_index);

-- ========================================
-- Table: audit_log
-- Complete audit trail
-- ========================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity TEXT NOT NULL, -- Test, Metrics, Checklist, State
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- Create, Update, Delete, Start, Finish, Cancel, Report
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    field TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ========================================
-- Function: Generate next test key
-- ========================================
CREATE OR REPLACE FUNCTION generate_next_test_key()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    next_key TEXT;
BEGIN
    -- Get the highest test number
    SELECT COALESCE(MAX(CAST(SUBSTRING(test_key FROM 3) AS INTEGER)), 0) + 1
    INTO next_number
    FROM tests
    WHERE test_key ~ '^T-[0-9]+$';
    
    -- Format as T-XXX (zero-padded to 3 digits)
    next_key := 'T-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN next_key;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Function: Calculate KPIs
-- ========================================
CREATE OR REPLACE FUNCTION calculate_kpis(metric_id UUID)
RETURNS VOID AS $$
DECLARE
    metric RECORD;
    pct_llamadas DECIMAL(10,2);
    pct_leads DECIMAL(10,2);
    pct_colgadas DECIMAL(10,2);
    dur_media DECIMAL(10,2);
    spam_pct DECIMAL(10,2);
    cb_2h DECIMAL(10,2);
    cb_24h DECIMAL(10,2);
    cost_per_lead DECIMAL(10,2);
BEGIN
    -- Get the metric record
    SELECT * INTO metric FROM test_metrics WHERE id = metric_id;
    
    -- Calculate % llamadas respondidas
    IF metric.llamadas_realizadas > 0 THEN
        pct_llamadas := ROUND((metric.llamadas_contestadas::DECIMAL / metric.llamadas_realizadas::DECIMAL * 100), 2);
    ELSE
        pct_llamadas := NULL;
    END IF;
    
    -- Calculate % leads que contestaron
    IF metric.leads_llamados > 0 THEN
        pct_leads := ROUND((metric.leads_con_respuesta::DECIMAL / metric.leads_llamados::DECIMAL * 100), 2);
    ELSE
        pct_leads := NULL;
    END IF;
    
    -- Calculate % colgadas por lead
    IF metric.llamadas_contestadas > 0 THEN
        pct_colgadas := ROUND((metric.llamadas_colgadas::DECIMAL / metric.llamadas_contestadas::DECIMAL * 100), 2);
    ELSE
        pct_colgadas := NULL;
    END IF;
    
    -- Calculate duración media
    IF metric.llamadas_contestadas > 0 THEN
        dur_media := ROUND((metric.duracion_total_contestadas_min / metric.llamadas_contestadas), 2);
    ELSE
        dur_media := NULL;
    END IF;
    
    -- Calculate spam rate
    IF metric.numeros_totales > 0 THEN
        spam_pct := ROUND((metric.numeros_con_spam::DECIMAL / metric.numeros_totales::DECIMAL * 100), 2);
    ELSE
        spam_pct := NULL;
    END IF;
    
    -- Calculate callback rates
    IF metric.vms_dejados > 0 THEN
        cb_2h := ROUND((metric.callbacks_en_2h::DECIMAL / metric.vms_dejados::DECIMAL * 100), 2);
        cb_24h := ROUND((metric.callbacks_en_24h::DECIMAL / metric.vms_dejados::DECIMAL * 100), 2);
    ELSE
        cb_2h := NULL;
        cb_24h := NULL;
    END IF;
    
    -- Calculate CLR (Cost per Lead Response)
    IF metric.leads_con_respuesta > 0 THEN
        cost_per_lead := ROUND(((metric.c_ans_eur * metric.llamadas_contestadas + 
                                 metric.c_min_eur * metric.duracion_total_contestadas_min) / 
                                metric.leads_con_respuesta), 2);
    ELSE
        cost_per_lead := NULL;
    END IF;
    
    -- Update the record with calculated KPIs
    UPDATE test_metrics SET
        pct_llamadas_respondidas = pct_llamadas,
        pct_leads_que_contestaron = pct_leads,
        pct_colgadas_por_lead = pct_colgadas,
        duracion_media_min = dur_media,
        spam_rate = spam_pct,
        callback_rate_2h = cb_2h,
        callback_rate_24h = cb_24h,
        clr = cost_per_lead
    WHERE id = metric_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Function: Auto-update updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tests table
CREATE TRIGGER trigger_tests_updated_at
    BEFORE UPDATE ON tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for changes_checklist table
CREATE TRIGGER trigger_checklist_updated_at
    BEFORE UPDATE ON changes_checklist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- RLS Policies
-- ========================================

-- Enable RLS
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE changes_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Tests policies
CREATE POLICY "tests_select_own" ON tests FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "tests_insert_own" ON tests FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "tests_update_own" ON tests FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "tests_delete_own" ON tests FOR DELETE USING (auth.uid() = owner_user_id);

-- Test metrics policies
CREATE POLICY "test_metrics_select_own" ON test_metrics FOR SELECT 
    USING (EXISTS (SELECT 1 FROM tests WHERE tests.test_key = test_metrics.test_key AND tests.owner_user_id = auth.uid()));
CREATE POLICY "test_metrics_insert_own" ON test_metrics FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM tests WHERE tests.test_key = test_metrics.test_key AND tests.owner_user_id = auth.uid()));
CREATE POLICY "test_metrics_update_own" ON test_metrics FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM tests WHERE tests.test_key = test_metrics.test_key AND tests.owner_user_id = auth.uid()));
CREATE POLICY "test_metrics_delete_own" ON test_metrics FOR DELETE 
    USING (EXISTS (SELECT 1 FROM tests WHERE tests.test_key = test_metrics.test_key AND tests.owner_user_id = auth.uid()));

-- Changes checklist policies
CREATE POLICY "checklist_select_own" ON changes_checklist FOR SELECT 
    USING (EXISTS (SELECT 1 FROM tests WHERE tests.test_key = changes_checklist.test_key AND tests.owner_user_id = auth.uid()));
CREATE POLICY "checklist_insert_own" ON changes_checklist FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM tests WHERE tests.test_key = changes_checklist.test_key AND tests.owner_user_id = auth.uid()));
CREATE POLICY "checklist_update_own" ON changes_checklist FOR UPDATE 
    USING (EXISTS (SELECT 1 FROM tests WHERE tests.test_key = changes_checklist.test_key AND tests.owner_user_id = auth.uid()));
CREATE POLICY "checklist_delete_own" ON changes_checklist FOR DELETE 
    USING (EXISTS (SELECT 1 FROM tests WHERE tests.test_key = changes_checklist.test_key AND tests.owner_user_id = auth.uid()));

-- Audit log policies (read-only for users, system writes)
CREATE POLICY "audit_select_own" ON audit_log FOR SELECT 
    USING (user_id = auth.uid());
CREATE POLICY "audit_insert_all" ON audit_log FOR INSERT 
    WITH CHECK (true); -- System can insert for any user

-- ========================================
-- Seed data for testing
-- ========================================

-- This will be populated by the application
-- No seed data needed initially

-- ========================================
-- Grant permissions
-- ========================================

GRANT ALL ON tests TO authenticated;
GRANT ALL ON test_metrics TO authenticated;
GRANT ALL ON changes_checklist TO authenticated;
GRANT ALL ON audit_log TO authenticated;
