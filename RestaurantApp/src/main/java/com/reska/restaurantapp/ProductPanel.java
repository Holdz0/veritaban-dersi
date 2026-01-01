package com.reska.restaurantapp;

import javax.swing.*;
import java.awt.*;
import java.sql.Connection;
import java.sql.PreparedStatement;

public class ProductPanel extends JPanel {

    JTextField nameField, priceField;
    JComboBox<String> typeBox, subTypeBox;
    JButton addButton;

    public ProductPanel() {
        setLayout(new GridLayout(6, 2));

        nameField = new JTextField();
        priceField = new JTextField();

        typeBox = new JComboBox<>(new String[]{"Yiyecek", "İçecek"});
        subTypeBox = new JComboBox<>(new String[]{"Yemek", "Tatlı"});

        typeBox.addActionListener(e -> {
            subTypeBox.removeAllItems();
            if (typeBox.getSelectedItem().equals("Yiyecek")) {
                subTypeBox.addItem("Yemek");
                subTypeBox.addItem("Tatlı");
            } else {
                subTypeBox.addItem("Sıcak");
                subTypeBox.addItem("Soğuk");
            }
        });

        addButton = new JButton("Ürün Ekle");
        addButton.addActionListener(e -> addProduct());

        add(new JLabel("Ürün Adı"));
        add(nameField);
        add(new JLabel("Fiyat"));
        add(priceField);
        add(new JLabel("Tür"));
        add(typeBox);
        add(new JLabel("Alt Tür"));
        add(subTypeBox);
        add(addButton);
    }

    private void addProduct() {
        try (Connection conn = DBConnection.getConnection()) {

            String sql =
                    "INSERT INTO product (name, price) VALUES (?, ?) RETURNING id";
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setString(1, nameField.getText());
            ps.setInt(2, Integer.parseInt(priceField.getText()));

            var rs = ps.executeQuery();
            rs.next();
            int productId = rs.getInt(1);

            if (typeBox.getSelectedItem().equals("Yiyecek")) {
                conn.prepareStatement(
                        "INSERT INTO yiyecek VALUES (" + productId + ")"
                ).execute();

                if (subTypeBox.getSelectedItem().equals("Yemek")) {
                    conn.prepareStatement(
                            "INSERT INTO yemek VALUES (" + productId + ")"
                    ).execute();
                } else {
                    conn.prepareStatement(
                            "INSERT INTO tatli VALUES (" + productId + ")"
                    ).execute();
                }
            } else {
                conn.prepareStatement(
                        "INSERT INTO icecek VALUES (" + productId + ")"
                ).execute();

                if (subTypeBox.getSelectedItem().equals("Sıcak")) {
                    conn.prepareStatement(
                            "INSERT INTO sicak_icecek VALUES (" + productId + ")"
                    ).execute();
                } else {
                    conn.prepareStatement(
                            "INSERT INTO soguk_icecek VALUES (" + productId + ")"
                    ).execute();
                }
            }

            JOptionPane.showMessageDialog(this, "Ürün eklendi");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
