import express from 'express';
import pg from 'pg';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════════
// STATİK DOSYALAR (Frontend)
// ═══════════════════════════════════════════════════════════════

app.use(express.static(path.join(__dirname, '../public')));

// ═══════════════════════════════════════════════════════════════
// VERITABANI BAĞLANTISI
// ═══════════════════════════════════════════════════════════════

const pool = new pg.Pool({
    host: 'localhost',
    port: 5432,
    database: 'EERCafe',
    user: 'postgres',
    password: 'ThEFETncr.2023'
});

// ═══════════════════════════════════════════════════════════════
// ÜRÜN İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════

app.get('/api/products', async (req, res) => {
    const result = await pool.query('SELECT id, name, price FROM product ORDER BY id');
    res.json(result.rows);
});

app.post('/api/products', async (req, res) => {
    const { name, price, type, subType } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const productResult = await client.query(
            'INSERT INTO product (name, price) VALUES ($1, $2) RETURNING id',
            [name, price]
        );
        const productId = productResult.rows[0].id;

        if (type === 'yiyecek') {
            await client.query('INSERT INTO yiyecek (product_id) VALUES ($1)', [productId]);

            if (subType === 'yemek') {
                await client.query('INSERT INTO yemek (product_id) VALUES ($1)', [productId]);
            } else {
                await client.query('INSERT INTO tatli (product_id) VALUES ($1)', [productId]);
            }
        } else {
            await client.query('INSERT INTO icecek (product_id) VALUES ($1)', [productId]);

            if (subType === 'sicak') {
                await client.query('INSERT INTO sicak_icecek (product_id) VALUES ($1)', [productId]);
            } else {
                await client.query('INSERT INTO soguk_icecek (product_id) VALUES ($1)', [productId]);
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, id: productId });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// ═══════════════════════════════════════════════════════════════
// PERSONEL İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════

app.get('/api/personel', async (req, res) => {
    // v_personel_detay view'ı kullanılıyor (Soru 19: View kullanımı)
    // Yeni şemada view: personel_id, ad, soyad, kurum_adi, yetki_adi, identity_name
    const result = await pool.query('SELECT personel_id, ad, soyad, kurum_adi, yetki_adi, identity_name FROM v_personel_detay ORDER BY personel_id');
    res.json(result.rows);
});

app.post('/api/personel', async (req, res) => {
    const { ad, soyad, kurumId, jobId } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const personelResult = await client.query(
            `INSERT INTO personel (ad, soyad, dt, kurum_id, yetki_id, identity_id, identity_no)
             VALUES ($1, $2, '1999-01-01', $3, 2, 1, $4) RETURNING personel_id`,
            [ad, soyad, kurumId, 'TC-' + Date.now()]
        );
        const personelId = personelResult.rows[0].personel_id;

        await client.query(
            'INSERT INTO pers_job_relation (personel_id, job_id) VALUES ($1, $2)',
            [personelId, jobId]
        );

        await client.query('COMMIT');
        res.json({ success: true, id: personelId });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// PROSEDÜR ÇAĞIRMA (Soru 18)
app.post('/api/personel/increase-process', async (req, res) => {
    const { personelId } = req.body;

    try {
        // Personelin job relation ID'sini bulmak lazım
        const relResult = await pool.query(
            'SELECT id FROM pers_job_relation WHERE personel_id = $1 LIMIT 1',
            [personelId]
        );

        if (relResult.rows.length > 0) {
            const relId = relResult.rows[0].id;
            // Prosedürü çağır
            await pool.query('CALL increase_process($1)', [relId]);
            res.json({ success: true, message: 'İşlem sayısı artırıldı' });
        } else {
            res.status(404).json({ error: 'Personel iş kaydı bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// KURUM İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════

app.get('/api/kurumlar', async (req, res) => {
    const result = await pool.query('SELECT kurum_id, kurum_adi, gelir FROM kurumlar ORDER BY kurum_id');
    res.json(result.rows);
});

app.post('/api/kurumlar', async (req, res) => {
    const { kurumAdi } = req.body;
    const result = await pool.query(
        'INSERT INTO kurumlar (kurum_adi, gelir) VALUES ($1, 0) RETURNING kurum_id',
        [kurumAdi]
    );
    res.json({ success: true, id: result.rows[0].kurum_id });
});

// ═══════════════════════════════════════════════════════════════
// SİPARİŞ İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════

app.get('/api/siparisler', async (req, res) => {
    const result = await pool.query(`
        SELECT s.id, p.name AS urun, p.price AS fiyat, sd.adet, m.loc AS masa,
               per.ad || ' ' || per.soyad AS garson
        FROM siparis s
        JOIN siparis_detay sd ON s.id = sd.siparis_id
        JOIN product p ON sd.product_id = p.id
        JOIN masa m ON s.table_id = m.id
        JOIN customer c ON s.customer_id = c.id
        JOIN pers_job_relation pjr ON c.garson_id = pjr.id
        JOIN personel per ON pjr.personel_id = per.personel_id
        ORDER BY s.id DESC
    `);
    res.json(result.rows);
});

app.post('/api/siparisler', async (req, res) => {
    const { masaId, musteriId, urunId, adet } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const siparisResult = await client.query(
            'INSERT INTO siparis (table_id, customer_id) VALUES ($1, $2) RETURNING id',
            [masaId, musteriId]
        );
        const siparisId = siparisResult.rows[0].id;

        await client.query(
            'INSERT INTO siparis_detay (siparis_id, product_id, adet) VALUES ($1, $2, $3)',
            [siparisId, urunId, adet]
        );

        await client.query('COMMIT');
        res.json({ success: true, id: siparisId });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// ═══════════════════════════════════════════════════════════════
// MENÜDEN SİPARİŞ OLUŞTUR (Müşteri için basitleştirilmiş)
// ═══════════════════════════════════════════════════════════════

app.post('/api/siparis-olustur', async (req, res) => {
    const { masaId, urunler } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // İlk garsonu bul (basitlik için)
        const garsonResult = await client.query(
            `SELECT id FROM pers_job_relation WHERE job_id = 1 LIMIT 1`
        );

        if (garsonResult.rows.length === 0) {
            throw new Error('Sistemde garson bulunamadı');
        }

        const garsonId = garsonResult.rows[0].id;

        // Müşteri oluştur
        const customerResult = await client.query(
            'INSERT INTO customer (garson_id) VALUES ($1) RETURNING id',
            [garsonId]
        );
        const customerId = customerResult.rows[0].id;

        // Sipariş oluştur
        const siparisResult = await client.query(
            'INSERT INTO siparis (table_id, customer_id) VALUES ($1, $2) RETURNING id',
            [masaId, customerId]
        );
        const siparisId = siparisResult.rows[0].id;

        // Her ürün için sipariş detayı ekle
        for (const urun of urunler) {
            await client.query(
                'INSERT INTO siparis_detay (siparis_id, product_id, adet) VALUES ($1, $2, $3)',
                [siparisId, urun.urunId, urun.adet]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, siparisId: siparisId });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// ═══════════════════════════════════════════════════════════════
// RAPORLAR (Soru 20 & 17)
// ═══════════════════════════════════════════════════════════════

app.get('/api/raporlar/urun-satis', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.name as urun_adi, 
                SUM(sd.adet) as toplam_adet, 
                SUM(sd.adet * p.price) as toplam_ciro
            FROM siparis_detay sd
            JOIN product p ON sd.product_id = p.id
            GROUP BY p.name
            ORDER BY toplam_ciro DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// v_siparis_detaylari VIEW kullanımı (Yeni eklenen)
app.get('/api/raporlar/siparis-detaylari', async (req, res) => {
    try {
        // v_siparis_detaylari view'ını kullanıyoruz
        const result = await pool.query('SELECT * FROM v_siparis_detaylari ORDER BY siparis_no DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// fn_toplam_kazanc FUNCTION kullanımı (Yeni eklenen)
app.get('/api/raporlar/toplam-kazanc', async (req, res) => {
    try {
        // fn_toplam_kazanc fonksiyonunu çağırıyoruz
        const result = await pool.query('SELECT fn_toplam_kazanc() as toplam_kazanc');
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════════════
// MÜŞTERİ VE YARDIMCI VERİLER
// ═══════════════════════════════════════════════════════════════

app.get('/api/musteriler', async (req, res) => {
    const result = await pool.query('SELECT id, garson_id FROM customer ORDER BY id');
    res.json(result.rows);
});

app.get('/api/masalar', async (req, res) => {
    const result = await pool.query('SELECT id, loc FROM masa ORDER BY id');
    res.json(result.rows);
});

app.get('/api/jobs', async (req, res) => {
    const result = await pool.query('SELECT id, job_name FROM job ORDER BY id');
    res.json(result.rows);
});

// ═══════════════════════════════════════════════════════════════
// MENÜ (KATEGORİLİ)
// ═══════════════════════════════════════════════════════════════

app.get('/api/menu', async (req, res) => {
    const yemekler = await pool.query(`
        SELECT p.id, p.name, p.price FROM product p
        JOIN yemek y ON p.id = y.product_id ORDER BY p.name
    `);

    const tatlilar = await pool.query(`
        SELECT p.id, p.name, p.price FROM product p
        JOIN tatli t ON p.id = t.product_id ORDER BY p.name
    `);

    const sicakIcecekler = await pool.query(`
        SELECT p.id, p.name, p.price FROM product p
        JOIN sicak_icecek si ON p.id = si.product_id ORDER BY p.name
    `);

    const sogukIcecekler = await pool.query(`
        SELECT p.id, p.name, p.price FROM product p
        JOIN soguk_icecek so ON p.id = so.product_id ORDER BY p.name
    `);

    res.json({
        yemekler: yemekler.rows,
        tatlilar: tatlilar.rows,
        sicakIcecekler: sicakIcecekler.rows,
        sogukIcecekler: sogukIcecekler.rows
    });
});

// ═══════════════════════════════════════════════════════════════
// SUNUCU BAŞLAT
// ═══════════════════════════════════════════════════════════════

app.listen(PORT, () => {
    console.log(`Restoran API: http://localhost:${PORT}`);
});
