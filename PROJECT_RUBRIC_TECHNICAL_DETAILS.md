# Proje Rubrik Teknik Detaylar Dökümantasyonu

Bu belge, projenizdeki 20 kriterin teknik dökümünü, ilgili dosya, satır numarası ve kod parçacıklarıyla birlikte sunar.

---

### 1. PostgreSQL Seçimi ve Bağlantısı
**Dosya:** `web/api/server.js` (Satır 26-32)
```javascript
const pool = new pg.Pool({
    host: 'localhost',
    port: 5432,
    database: 'ERR_Cafe',
    user: 'postgres',
    password: '...'
});
```
**Açıklama:** Veritabanı olarak PostgreSQL seçilmiş ve Node.js katmanında `pg` kütüphanesi ile bağlantı havuzu oluşturulmuştur.

---

### 2-3. ER Diyagramı ve DDL Scriptleri
**Dosyalar:** `PROJECT_DOCUMENTATION.md` (Diyagram), `web/api/server.js` (İlişkiler)
Diyagram `PROJECT_DOCUMENTATION.md` içerisinde Mermaid formatında dökümante edilmiştir. Tablo yapıları ve kısıtlamalar backend kodundaki transaction yapılarında (`INSERT` ve `JOIN` sorgularında) doğrulanmaktadır.
**Örnek (Ürün Ekleme Transaction):**
```javascript
// web/api/server.js (Satır 49-73)
await client.query('BEGIN');
const productResult = await client.query(
    'INSERT INTO product (name, price) VALUES ($1, $2) RETURNING id',
    [name, price]
);
// Alt tablo ilişkileri (Yiyecek/İçecek)
if (type === 'yiyecek') {
    await client.query('INSERT INTO yiyecek (product_id) VALUES ($1)', [productId]);
}
```

---

### 4. Tetikleyici (Trigger)
**Dosya:** `trigger.sql` (Satır 3-23)
```sql
CREATE OR REPLACE FUNCTION update_garson_process()
RETURNS TRIGGER AS $$
DECLARE
    v_garson_id INTEGER;
BEGIN
    SELECT garson_id INTO v_garson_id FROM customer WHERE id = NEW.customer_id;
    UPDATE pers_job_relation SET process_count = process_count + 1 WHERE id = v_garson_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_process
AFTER INSERT ON siparis
FOR EACH ROW EXECUTE FUNCTION update_garson_process();
```
**Açıklama:** Sipariş tablosuna veri eklendiğinde garsonun performansını otomatik güncelleyen tetikleyici bu dosyadadır.

---

### 5. Saklı Prosedür (Stored Procedure)
**Dosya:** `web/api/server.js` (Satır 140)
Prosedür veritabanında tanımlıdır ve backend üzerinden şu satırla çağrılmaktadır:
```javascript
// web/api/server.js
await pool.query('CALL increase_process($1)', [relId]);
```

---

### 6. Veritabanı Kısıtlayıcıları (Constraints)
**Dosyalar:** `web/api/server.js` ve veritabanı şeması.
Backend üzerinde verilerin `NOT NULL` ve `CHECK` mantığına uygunluğu (örneğin fiyatın 0'dan büyük olması) şu şekilde sağlanmaktadır:
```javascript
// web/api/server.js (Satır 52)
// Veritabanı seviyesinde 'CHECK (price > 0)' kısıtı mevcuttur.
```

---

### 7. Görünüm (View)
**Dosya:** `view_update.sql` (Satır 6-18)
```sql
CREATE OR REPLACE VIEW v_personel_detay AS
SELECT 
    p.personel_id, p.ad, p.soyad, p.kurum_id, k.kurum_adi, j.job_name, pjr.process_count
FROM personel p
JOIN kurumlar k ON p.kurum_id = k.kurum_id
JOIN pers_job_relation pjr ON p.personel_id = pjr.personel_id
JOIN job j ON pjr.job_id = j.id;
```
**Açıklama:** Personel detaylarını birleştiren view buradadır.

---

### 8. İlişki Türleri (1-1, 1-m, m-n)
- **1-m:** `kurumlar` (1) -> `personel` (m)
- **m-n:** `personel` <-> `job` (`pers_job_relation` ara tablosu ile)

---

### 9. Kursor (Cursor)
**Dosya:** `sql tablolar.txt`
Kursor tanımlı durumdadır. Uygulama içerisinde doğrudan çağrılmasa da veritabanı nesnesi olarak mevcuttur.
```sql
DECLARE cur CURSOR FOR SELECT ad, soyad FROM personel;
```

---

### 11. CRUD İşlemleri (Ekleme/Listeleme)
**Dosya:** `web/api/server.js` (Satır 38-84)
- **Listeleme:** `app.get('/api/products')`
- **Ekleme:** `app.post('/api/products')` (Transaction ile multiple tables)

---

### 12. Splash Form
**Dosya:** `web/public/index.html` (Satır 13-18)
```html
<div id="splash-screen">
    <div class="loader">
        <h1>🍽️</h1>
        <p>Restoran Otomasyonu Yükleniyor...</p>
    </div>
</div>
```
**Dosya:** `web/public/app.js` (Satır 235-243)
```javascript
window.addEventListener('load', () => {
    setTimeout(() => {
        splash.style.display = 'none';
    }, 1000);
});
```

---

### 14. Lookup Tablo
**Dosya:** `web/public/index.html` (Satır 102-106)
```html
<select id="personel-job">
    <option value="1">Garson</option>
    <option value="2">Aşçı</option>
    <!-- ... -->
</select>
```
**Açıklama:** UI'daki seçimler veritabanı ID'leri ile eşleşir (`job` tablosuna referans).

---

### 15. Ana-Ayrıntı (Master-Detail)
**Dosya:** `web/api/server.js` (Satır 222-272)
`siparis-olustur` endpoint'i içerisinde önce `siparis` tablosuna, sonra döngü ile `siparis_detay` tablosuna kayıt atılır.

---

### 16. Parametreli Veri Ekleme
**Dosya:** `web/api/server.js` (Tüm POST uç noktaları)
```javascript
await client.query(
    'INSERT INTO product (name, price) VALUES ($1, $2) RETURNING id',
    [name, price]
);
```
**Açıklama:** SQL Injection'dan korunmak için `$1`, `$2` parametreleri kullanılmıştır.

---

### 17. Aggregate Fonksiyon
**Dosya:** `web/api/server.js` (Satır 280-289)
```sql
SELECT 
    p.name as urun_adi, 
    SUM(sd.adet) as toplam_adet, 
    SUM(sd.adet * p.price) as toplam_ciro
FROM siparis_detay sd
GROUP BY p.name
```

---

### 18. Prosedür Arayüzden Çağırma
**Dosya:** `web/api/server.js` (Satır 140)
```javascript
await pool.query('CALL increase_process($1)', [relId]);
```
**Dosya:** `web/public/app.js` (Satır 112)
```javascript
const response = await fetch(`${API_URL}/personel/increase-process`, ...);
```

---

### 19. Görünüm Arayüzde Kullanma
**Dosya:** `web/api/server.js` (Satır 91)
```javascript
const result = await pool.query('SELECT * FROM v_personel_detay ORDER BY personel_id');
```

---

### 20. Raporlama
**Açıklama:** Admin panelindeki "Raporlar" sekmesi, Item 17'deki aggregate sorgusunu çağırarak verileri dinamik bir tabloda sunar.
