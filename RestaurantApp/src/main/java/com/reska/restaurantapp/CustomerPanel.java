package com.reska.restaurantapp;

import javax.swing.*;
import java.awt.*;
import java.sql.Connection;
import java.sql.PreparedStatement;

public class CustomerPanel extends JPanel {

    JTextField garsonField;

    public CustomerPanel() {
        setLayout(new GridLayout(2, 2));

        garsonField = new JTextField();
        JButton btn = new JButton("Müşteri Ekle");
        btn.addActionListener(e -> addCustomer());

        add(new JLabel("Garson ID"));
        add(garsonField);
        add(btn);
    }

    private void addCustomer() {
        try (Connection conn = DBConnection.getConnection()) {
            PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO customer (garson_id) VALUES (?)"
            );
            ps.setInt(1, Integer.parseInt(garsonField.getText()));
            ps.execute();

            JOptionPane.showMessageDialog(this, "Müşteri eklendi");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
