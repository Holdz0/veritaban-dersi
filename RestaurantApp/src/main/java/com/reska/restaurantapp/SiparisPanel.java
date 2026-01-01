package com.reska.restaurantapp;

import javax.swing.*;
import java.awt.*;
import java.sql.*;

public class SiparisPanel extends JPanel {

    JTextField masaField, productField, adetField, customerField;

    public SiparisPanel() {

        setLayout(new GridLayout(5, 2));

        masaField = new JTextField();
        productField = new JTextField();
        adetField = new JTextField();
        customerField = new JTextField();

        JButton btn = new JButton("Sipariş Al");
        btn.addActionListener(e -> addOrder());

        add(new JLabel("Masa ID"));
        add(masaField);

        add(new JLabel("Ürün ID"));
        add(productField);

        add(new JLabel("Adet"));
        add(adetField);

        add(new JLabel("Müşteri ID"));
        add(customerField);

        add(btn);
    }

    private void addOrder() {

        try (Connection conn = DBConnection.getConnection()) {

            conn.setAutoCommit(false);

            // 1️⃣ Sipariş oluştur
            PreparedStatement psSiparis = conn.prepareStatement(
                    "INSERT INTO siparis (table_id, customer_id) VALUES (?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );

            psSiparis.setInt(1, Integer.parseInt(masaField.getText()));
            psSiparis.setInt(2, Integer.parseInt(customerField.getText()));
            psSiparis.executeUpdate();

            ResultSet rs = psSiparis.getGeneratedKeys();
            rs.next();
            int siparisId = rs.getInt(1);

            // 2️⃣ Sipariş detayı ekle
            PreparedStatement psDetay = conn.prepareStatement(
                    "INSERT INTO siparis_detay (siparis_id, product_id, adet) VALUES (?, ?, ?)"
            );

            psDetay.setInt(1, siparisId);
            psDetay.setInt(2, Integer.parseInt(productField.getText()));
            psDetay.setInt(3, Integer.parseInt(adetField.getText()));
            psDetay.executeUpdate();

            conn.commit();

            JOptionPane.showMessageDialog(this, "Sipariş alındı");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
