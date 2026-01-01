package com.reska.restaurantapp;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.sql.*;

public class ProductListPanel extends JPanel {

    JTable table;
    DefaultTableModel model;

    public ProductListPanel() {
        model = new DefaultTableModel();
        table = new JTable(model);

        model.addColumn("ID");
        model.addColumn("Ad");
        model.addColumn("Fiyat");

        loadProducts();

        add(new JScrollPane(table));
    }

    private void loadProducts() {
        try (Connection conn = DBConnection.getConnection()) {
            Statement st = conn.createStatement();
            ResultSet rs = st.executeQuery(
                    "SELECT id, name, price FROM product"
            );

            while (rs.next()) {
                model.addRow(new Object[]{
                        rs.getInt("id"),
                        rs.getString("name"),
                        rs.getInt("price")
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
