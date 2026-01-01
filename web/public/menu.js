const API_URL = 'http://localhost:3000/api';

let sepet = [];

// ═══════════════════════════════════════════════════════════════
// MENÜ YÜKLE
// ═══════════════════════════════════════════════════════════════

async function menuYukle() {
    const response = await fetch(`${API_URL}/menu`);
    const menu = await response.json();

    document.getElementById('yemekler').innerHTML = menu.yemekler.length
        ? menu.yemekler.map(urunKarti).join('')
        : '<p class="empty-message">Henüz yemek eklenmedi</p>';

    document.getElementById('tatlilar').innerHTML = menu.tatlilar.length
        ? menu.tatlilar.map(urunKarti).join('')
        : '<p class="empty-message">Henüz tatlı eklenmedi</p>';

    document.getElementById('sicak-icecekler').innerHTML = menu.sicakIcecekler.length
        ? menu.sicakIcecekler.map(urunKarti).join('')
        : '<p class="empty-message">Henüz sıcak içecek eklenmedi</p>';

    document.getElementById('soguk-icecekler').innerHTML = menu.sogukIcecekler.length
        ? menu.sogukIcecekler.map(urunKarti).join('')
        : '<p class="empty-message">Henüz soğuk içecek eklenmedi</p>';
}

function urunKarti(urun) {
    return `
        <div class="menu-item" onclick="sepeteEkle(${urun.id}, '${urun.name}', ${urun.price})">
            <span class="menu-item-name">${urun.name}</span>
            <span class="menu-item-price">${urun.price} ₺</span>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// SEPET İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════

function sepeteEkle(id, name, price) {
    const mevcut = sepet.find(item => item.id === id);

    if (mevcut) {
        mevcut.adet++;
    } else {
        sepet.push({ id, name, price, adet: 1 });
    }

    sepetiGoster();
}

function sepettenCikar(id) {
    const index = sepet.findIndex(item => item.id === id);

    if (index !== -1) {
        if (sepet[index].adet > 1) {
            sepet[index].adet--;
        } else {
            sepet.splice(index, 1);
        }
    }

    sepetiGoster();
}

function sepetiGoster() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const orderBtn = document.getElementById('order-btn');

    if (sepet.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Sepetiniz boş</p>';
        cartTotal.textContent = '0';
        orderBtn.disabled = true;
        return;
    }

    cartItems.innerHTML = sepet.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <span class="cart-item-qty">${item.adet}x</span>
                <span>${item.name}</span>
            </div>
            <button class="cart-item-remove" onclick="sepettenCikar(${item.id})">×</button>
        </div>
    `).join('');

    const toplam = sepet.reduce((total, item) => total + (item.price * item.adet), 0);
    cartTotal.textContent = toplam;
    orderBtn.disabled = false;
}

// ═══════════════════════════════════════════════════════════════
// SİPARİŞ VER
// ═══════════════════════════════════════════════════════════════

document.getElementById('order-btn').addEventListener('click', async function () {
    if (sepet.length === 0) return;

    const masaId = document.getElementById('masa-select').value;

    const siparis = {
        masaId: parseInt(masaId),
        urunler: sepet.map(item => ({
            urunId: item.id,
            adet: item.adet
        }))
    };

    try {
        const response = await fetch(`${API_URL}/siparis-olustur`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(siparis)
        });

        const result = await response.json();

        if (result.success) {
            alert('Siparişiniz alındı! Sipariş No: ' + result.siparisId);
            sepet = [];
            sepetiGoster();
        } else {
            alert('Hata: ' + result.error);
        }
    } catch (error) {
        alert('Bağlantı hatası!');
    }
});

// ═══════════════════════════════════════════════════════════════
// BAŞLANGIÇ
// ═══════════════════════════════════════════════════════════════

menuYukle();
sepetiGoster();
