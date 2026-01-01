package com.reska.restaurantapp;

import javax.swing.*;

public class MainFrame extends JFrame {

    public MainFrame() {
        setTitle("Restoran Otomasyonu");
        setSize(800, 600);
        setDefaultCloseOperation(EXIT_ON_CLOSE);

       JTabbedPane tabs = new JTabbedPane();
tabs.add("Ürün Ekle", new ProductPanel());
tabs.add("Sipariş Al", new SiparisPanel());
tabs.add("Müşteri", new CustomerPanel());
tabs.add("Ürünler", new ProductListPanel());
tabs.add("Siparişler", new SiparisListPanel());
tabs.add("Personeller", new PersonelListPanel());
tabs.add("Kurumlar", new KurumListPanel());

add(tabs);

    }
}
