
-- Önce eski view'ı sil (Eğer varsa)
DROP VIEW IF EXISTS v_personel_detay CASCADE;

-- Yeni view oluştur
CREATE OR REPLACE VIEW v_personel_detay AS
SELECT 
    p.personel_id,
    p.ad,
    p.soyad,
    p.kurum_id,
    k.kurum_adi,
    j.job_name,
    pjr.process_count
FROM personel p
JOIN kurumlar k ON p.kurum_id = k.kurum_id
JOIN pers_job_relation pjr ON p.personel_id = pjr.personel_id
JOIN job j ON pjr.job_id = j.id;
