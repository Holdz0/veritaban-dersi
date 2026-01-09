const API_URL = 'http://localhost:3000/api';

// ═══════════════════════════════════════════════════════════════
// SEKME GEÇİŞLERİ
// ═══════════════════════════════════════════════════════════════

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// ═══════════════════════════════════════════════════════════════
// ÜRÜN İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════

document.getElementById('urun-tur').addEventListener('change', function () {
    const altTurSelect = document.getElementById('urun-alt-tur');
    altTurSelect.innerHTML = '';

    if (this.value === 'yiyecek') {
        altTurSelect.innerHTML = '<option value="yemek">Yemek</option><option value="tatli">Tatlı</option>';
    } else {
        altTurSelect.innerHTML = '<option value="sicak">Sıcak</option><option value="soguk">Soğuk</option>';
    }
});

document.getElementById('urun-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const urun = {
        name: document.getElementById('urun-adi').value,
        price: parseInt(document.getElementById('urun-fiyat').value),
        type: document.getElementById('urun-tur').value,
        subType: document.getElementById('urun-alt-tur').value
    };

    await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(urun)
    });

    this.reset();
    urunleriYukle();
});

async function urunleriYukle() {
    const response = await fetch(`${API_URL}/products`);
    const urunler = await response.json();

    const tbody = document.querySelector('#urun-tablosu tbody');
    tbody.innerHTML = urunler.map(urun => `
        <tr>
            <td>${urun.id}</td>
            <td>${urun.name}</td>
            <td>${urun.price} ₺</td>
        </tr>
    `).join('');
}

// ═══════════════════════════════════════════════════════════════
// PERSONEL İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════

document.getElementById('personel-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const personel = {
        ad: document.getElementById('personel-ad').value,
        soyad: document.getElementById('personel-soyad').value,
        kurumId: parseInt(document.getElementById('personel-kurum').value),
        jobId: parseInt(document.getElementById('personel-job').value)
    };

    await fetch(`${API_URL}/personel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personel)
    });

    this.reset();
    personelYukle();
});

async function personelYukle() {
    const response = await fetch(`${API_URL}/personel`);
    const personeller = await response.json();

    const tbody = document.querySelector('#personel-tablosu tbody');
    tbody.innerHTML = personeller.map(p => `
        <tr>
            <td>${p.personel_id}</td>
            <td>${p.ad}</td>
            <td>${p.soyad}</td>
            <td>${p.kurum_id}</td>
            <td>${p.job_name}</td>
            <td>${p.process_count}</td>
            <td>
                <button onclick="islemArtir(${p.personel_id})" class="btn-sm">➕ İşlem Artır</button>
            </td>
        </tr>
    `).join('');
}

async function islemArtir(personelId) {
    try {
        const response = await fetch(`${API_URL}/personel/increase-process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ personelId })
        });

        const result = await response.json();
        if (result.success) {
            alert('İşlem sayısı başarıyla artırıldı!');
        } else {
            alert('Hata: ' + result.error);
        }
    } catch (error) {
        alert('Bağlantı hatası!');
    }
}

// ═══════════════════════════════════════════════════════════════
// KURUM İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════

document.getElementById('kurum-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const kurum = {
        kurumAdi: document.getElementById('kurum-adi').value
    };

    await fetch(`${API_URL}/kurumlar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kurum)
    });

    this.reset();
    kurumlariYukle();
});

async function kurumlariYukle() {
    const response = await fetch(`${API_URL}/kurumlar`);
    const kurumlar = await response.json();

    const tbody = document.querySelector('#kurum-tablosu tbody');
    tbody.innerHTML = kurumlar.map(k => `
        <tr>
            <td>${k.kurum_id}</td>
            <td>${k.kurum_adi}</td>
            <td>${k.gelir} ₺</td>
        </tr>
    `).join('');
}

// ═══════════════════════════════════════════════════════════════
// SİPARİŞ İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════

document.getElementById('siparis-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const siparis = {
        masaId: parseInt(document.getElementById('siparis-masa').value),
        musteriId: parseInt(document.getElementById('siparis-musteri').value),
        urunId: parseInt(document.getElementById('siparis-urun').value),
        adet: parseInt(document.getElementById('siparis-adet').value)
    };

    await fetch(`${API_URL}/siparisler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siparis)
    });

    this.reset();
    document.getElementById('siparis-adet').value = '1';
    siparisleriYukle();
});

async function siparisleriYukle() {
    const response = await fetch(`${API_URL}/siparisler`);
    const siparisler = await response.json();

    const tbody = document.querySelector('#siparis-tablosu tbody');
    tbody.innerHTML = siparisler.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${s.urun}</td>
            <td>${s.fiyat} ₺</td>
            <td>${s.adet}</td>
            <td>${s.masa}</td>
            <td>${s.garson}</td>
        </tr>
    `).join('');
}

// ═══════════════════════════════════════════════════════════════
// RAPOR İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════

async function raporlariYukle() {
    const response = await fetch(`${API_URL}/raporlar/urun-satis`);
    const rapor = await response.json();

    const tbody = document.querySelector('#rapor-tablosu tbody');
    tbody.innerHTML = rapor.map(r => `
        <tr>
            <td>${r.urun_adi}</td>
            <td>${r.toplam_adet}</td>
            <td>${r.toplam_ciro} ₺</td>
        </tr>
    `).join('');
}

// ═══════════════════════════════════════════════════════════════
// BAŞLANGIÇ
// ═══════════════════════════════════════════════════════════════

urunleriYukle();
personelYukle();
kurumlariYukle();
siparisleriYukle();
raporlariYukle();

// SPLASH SCREEN (Soru 12)
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
        }, 500);
    }, 1000); // 1 saniye bekle
});
