package com.reska.restaurantapp;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.sql.*;

public class KurumListPanel extends JPanel {

    private DefaultTableModel model;

    public KurumListPanel() {
        setLayout(null);

        model = new DefaultTableModel(
                new String[]{"ID", "Kurum Adı", "Gelir"}, 0);

        JTable table = new JTable(model);
        JScrollPane sp = new JScrollPane(table);
        sp.setBounds(20, 20, 500, 300);
        add(sp);

        JLabel lblAd = new JLabel("Kurum Adı:");
        lblAd.setBounds(550, 40, 100, 25);
        add(lblAd);

        JTextField txtAd = new JTextField();
        txtAd.setBounds(650, 40, 180, 25);
        add(txtAd);

        JButton btnEkle = new JButton("Kurum Ekle");
        btnEkle.setBounds(650, 80, 120, 30);
        add(btnEkle);

        btnEkle.addActionListener(e -> {
            try (Connection conn = DBConnection.getConnection()) {

                PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO kurumlar (kurum_adi, gelir) VALUES (?, 0)");
                ps.setString(1, txtAd.getText());
                ps.executeUpdate();

                txtAd.setText("");
                loadKurumlar();

            } catch (Exception ex) {
                ex.printStackTrace();
            }
        });

        loadKurumlar();
    }

    private void loadKurumlar() {
        model.setRowCount(0);

        try (Connection conn = DBConnection.getConnection();
             Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT * FROM kurumlar")) {

            while (rs.next()) {
                model.addRow(new Object[]{
                        rs.getInt("kurum_id"),
                        rs.getString("kurum_adi"),
                        rs.getInt("gelir")
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
