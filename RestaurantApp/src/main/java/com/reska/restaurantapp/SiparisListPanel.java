package com.reska.restaurantapp;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.sql.*;

public class SiparisListPanel extends JPanel {

    JTable table;
    DefaultTableModel model;

    public SiparisListPanel() {

        model = new DefaultTableModel(
                new String[]{"Sipariş ID", "Ürün", "Fiyat", "Adet", "Masa", "Garson"}, 0
        );

        table = new JTable(model);
        add(new JScrollPane(table));

        loadOrders();
    }

    private void loadOrders() {

        model.setRowCount(0);

        try (Connection conn = DBConnection.getConnection()) {

            String sql = """
                SELECT s.id,
                       p.name,
                       p.price,
                       sd.adet,
                       m.loc,
                       per.ad || ' ' || per.soyad AS garson
                FROM siparis s
                JOIN siparis_detay sd ON s.id = sd.siparis_id
                JOIN product p ON sd.product_id = p.id
                JOIN masa m ON s.table_id = m.id
                JOIN customer c ON s.customer_id = c.id
                JOIN pers_job_relation pjr ON c.garson_id = pjr.id
                JOIN personel per ON pjr.personel_id = per.personel_id
            """;

            ResultSet rs = conn.createStatement().executeQuery(sql);

            while (rs.next()) {
                model.addRow(new Object[]{
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getInt("price"),
                        rs.getInt("adet"),
                        rs.getInt("loc"),
                        rs.getString("garson")
                });
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
