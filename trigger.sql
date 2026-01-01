
-- TRIGGER (SORU 4)
CREATE OR REPLACE FUNCTION update_garson_process()
RETURNS TRIGGER AS $$
DECLARE
    v_garson_id INTEGER;
BEGIN
    -- Müşterinin garsonunu bul
    SELECT garson_id INTO v_garson_id FROM customer WHERE id = NEW.customer_id;
    
    -- Garsonun işlem sayısını 1 artır
    UPDATE pers_job_relation
    SET process_count = process_count + 1
    WHERE id = v_garson_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_process
AFTER INSERT ON siparis
FOR EACH ROW
EXECUTE FUNCTION update_garson_process();
