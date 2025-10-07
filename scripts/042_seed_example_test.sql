-- ========================================
-- Seed Example Test: Fixed vs Mobile (Finished)
-- This creates a complete finished test with metrics
-- ========================================

-- Insert example test for the current user
DO $$
DECLARE
    current_user_id UUID;
    test_id UUID;
    test_key_val TEXT := 'T-001';
    full_id_val TEXT := 'T-001-FM-2025-10-07';
BEGIN
    -- Get current authenticated user (you'll need to be logged in)
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user found. Please log in first.';
        RETURN;
    END IF;
    
    -- Check if test already exists
    IF EXISTS (SELECT 1 FROM tests WHERE test_key = test_key_val AND owner_user_id = current_user_id) THEN
        RAISE NOTICE 'Example test already exists for this user.';
        RETURN;
    END IF;
    
    -- Insert the test
    INSERT INTO tests (
        test_key,
        code,
        full_id,
        name,
        alternative_name,
        hypothesis,
        objective,
        design,
        variants,
        sample_per_variant,
        duration_hours,
        status,
        created_at,
        started_at,
        ended_at,
        owner_user_id,
        parent_test_key,
        iteration_index,
        success_criteria,
        independent_variable,
        dependent_variables,
        planned_start_date,
        channels,
        operational_notes,
        phone_numbers_used
    ) VALUES (
        test_key_val,
        'FM',
        full_id_val,
        'FM | Mobile vs Fixed | 2025-10-07',
        'Fixed vs Mobile Number Test',
        'Mobile numbers will have a higher answer rate than fixed numbers due to increased portability and personal use. We expect at least 10% improvement in contact rate while maintaining spam rates below 5%.',
        'Increase call answer rate by at least 10%',
        'Population: 200 leads from Q4 2024 campaign
Inclusion criteria: Leads that have not been contacted in the last 30 days
Variant assignment: Random 50/50 split (100 Mobile, 100 Fixed)
Call scripts: Standard sales pitch (identical for both variants)
Cadence: 4 attempts per lead with ring durations of 15s, 20s, 30s, and until hang-up
Voicemail: Only on 4th attempt
Limits: Maximum 2 calls per lead within the same hour
Operating hours: 09:30 to 18:30 (Europe/Madrid)',
        '[
            {"id": "A", "label": "Mobile"},
            {"id": "B", "label": "Fixed"}
        ]'::jsonb,
        '{"A": 100, "B": 100}'::jsonb,
        24,
        'Finished',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '2 days',
        current_user_id,
        NULL,
        0,
        'The variant wins if it achieves higher answer rate AND higher contact rate without increasing spam rate or hang-up rate. In case of tie, lowest average attempts wins.',
        'phone_number_type',
        '["tasa_respuesta", "tasa_contacto", "spam_rate", "intentos_promedio", "clr"]'::jsonb,
        (NOW() - INTERVAL '3 days')::date,
        '["phone"]'::jsonb,
        'Test executed during business hours only. Weather conditions: normal. No major holidays during test period.',
        '[]'::jsonb
    ) RETURNING id INTO test_id;
    
    -- Insert metrics for Variant A (Mobile)
    INSERT INTO test_metrics (
        test_key,
        iteration_index,
        variant_id,
        llamadas_realizadas,
        llamadas_contestadas,
        leads_llamados,
        leads_con_respuesta,
        intentos_hasta_respuesta_promedio,
        llamadas_colgadas,
        duracion_total_contestadas_min,
        numeros_totales,
        numeros_con_spam,
        vms_dejados,
        callbacks_en_2h,
        callbacks_en_24h,
        c_ans_eur,
        c_min_eur,
        ttfa_median_min,
        data_source
    ) VALUES (
        test_key_val,
        0,
        'A',
        380,
        160,
        100,
        48,
        2.2,
        22,
        410.0,
        1,
        0,
        30,
        5,
        10,
        0.12,
        0.03,
        14.5,
        'Manual'
    );
    
    -- Insert metrics for Variant B (Fixed)
    INSERT INTO test_metrics (
        test_key,
        iteration_index,
        variant_id,
        llamadas_realizadas,
        llamadas_contestadas,
        leads_llamados,
        leads_con_respuesta,
        intentos_hasta_respuesta_promedio,
        llamadas_colgadas,
        duracion_total_contestadas_min,
        numeros_totales,
        numeros_con_spam,
        vms_dejados,
        callbacks_en_2h,
        callbacks_en_24h,
        c_ans_eur,
        c_min_eur,
        ttfa_median_min,
        data_source
    ) VALUES (
        test_key_val,
        0,
        'B',
        420,
        145,
        100,
        42,
        2.6,
        28,
        380.0,
        1,
        1,
        35,
        4,
        8,
        0.12,
        0.03,
        16.2,
        'Manual'
    );
    
    -- Calculate KPIs for Variant A
    PERFORM calculate_kpis((SELECT id FROM test_metrics WHERE test_key = test_key_val AND variant_id = 'A' LIMIT 1));
    
    -- Calculate KPIs for Variant B
    PERFORM calculate_kpis((SELECT id FROM test_metrics WHERE test_key = test_key_val AND variant_id = 'B' LIMIT 1));
    
    -- Insert audit log entry
    INSERT INTO audit_log (
        entity,
        entity_id,
        action,
        user_id,
        new_value
    ) VALUES (
        'Test',
        full_id_val,
        'Create',
        current_user_id,
        'Example test created with finished status and metrics'
    );
    
    RAISE NOTICE 'Example test created successfully with ID: %', full_id_val;
    RAISE NOTICE 'Variant A (Mobile): 160/380 calls answered (42.1%%), 48/100 leads contacted (48.0%%)';
    RAISE NOTICE 'Variant B (Fixed): 145/420 calls answered (34.5%%), 42/100 leads contacted (42.0%%)';
    RAISE NOTICE 'Winner: Mobile variant with higher answer rate and contact rate';
    
END $$;
