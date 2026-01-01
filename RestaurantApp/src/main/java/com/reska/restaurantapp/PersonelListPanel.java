package com.reska.restaurantapp;

import javax.swing.*;
import javax.swing.table.DefaultTableModel;
import java.sql.*;

public class PersonelListPanel extends JPanel {

    private DefaultTableModel model;

    public PersonelListPanel() {
        setLayout(null);

        model = new DefaultTableModel(
                new String[]{"ID", "Ad", "Soyad", "Kurum ID", "Görev"}, 0);

        JTable table = new JTable(model);
        JScrollPane sp = new JScrollPane(table);
        sp.setBounds(20, 20, 520, 300);
        add(sp);

        JLabel lblAd = new JLabel("Ad:");
        JLabel lblSoyad = new JLabel("Soyad:");
        JLabel lblKurum = new JLabel("Kurum ID:");
        JLabel lblJob = new JLabel("Görev:");

        JTextField txtAd = new JTextField();
        JTextField txtSoyad = new JTextField();
        JTextField txtKurum = new JTextField();

        JComboBox<String> cbJob = new JComboBox<>(
                new String[]{"Garson", "Aşçı", "Müdür"}
        );

        JButton btnEkle = new JButton("Personel Ekle");

        lblAd.setBounds(570, 30, 100, 25);
        txtAd.setBounds(670, 30, 180, 25);

        lblSoyad.setBounds(570, 65, 100, 25);
        txtSoyad.setBounds(670, 65, 180, 25);

        lblKurum.setBounds(570, 100, 100, 25);
        txtKurum.setBounds(670, 100, 180, 25);

        lblJob.setBounds(570, 135, 100, 25);
        cbJob.setBounds(670, 135, 180, 25);

        btnEkle.setBounds(670, 180, 150, 30);

        add(lblAd); add(txtAd);
        add(lblSoyad); add(txtSoyad);
        add(lblKurum); add(txtKurum);
        add(lblJob); add(cbJob);
        add(btnEkle);

        btnEkle.addActionListener(e -> addPersonel(
                txtAd, txtSoyad, txtKurum, cbJob
        ));

        loadPersonel();
    }

   private void addPersonel(JTextField txtAd,
                         JTextField txtSoyad,
                         JTextField txtKurum,
                         JComboBox<String> cbJob) {

    try (Connection conn = DBConnection.getConnection()) {

        conn.setAutoCommit(false);

        PreparedStatement psPersonel =
                conn.prepareStatement(
                        """
                        INSERT INTO personel
                        (ad, soyad, dt, kurum_id, yetki_id, identity_id, identity_no)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        Statement.RETURN_GENERATED_KEYS
                );

        psPersonel.setString(1, txtAd.getText());
        psPersonel.setString(2, txtSoyad.getText());
        psPersonel.setDate(3, Date.valueOf("1999-01-01")); // ✔ NOT NULL
        psPersonel.setInt(4, Integer.parseInt(txtKurum.getText()));
        psPersonel.setInt(5, 2); // yetki_id (Personel)
        psPersonel.setInt(6, 1); // identity_id (TC)
        psPersonel.setString(7, "TC-" + System.currentTimeMillis()); // UNIQUE

        psPersonel.executeUpdate();

        ResultSet keys = psPersonel.getGeneratedKeys();
        keys.next();
        int personelId = keys.getInt(1);

        // JOB
        int jobId = switch (cbJob.getSelectedItem().toString()) {
            case "Garson" -> 1;
            case "Aşçı" -> 2;
            case "Müdür" -> 3;
            default -> 1;
        };

        PreparedStatement psJob =
                conn.prepareStatement(
                        """
                        INSERT INTO pers_job_relation (personel_id, job_id)
                        VALUES (?, ?)
                        """
                );

        psJob.setInt(1, personelId);
        psJob.setInt(2, jobId);
        psJob.executeUpdate();

        conn.commit();

        JOptionPane.showMessageDialog(this, "Personel eklendi");

        loadPersonel();

    } catch (Exception e) {
        e.printStackTrace();
    }
}


    private void loadPersonel() {
        model.setRowCount(0);

        try (Connection conn = DBConnection.getConnection();
             Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery(
                     """
                     SELECT p.personel_id,
                            p.ad,
                            p.soyad,
                            p.kurum_id,
                            j.job_name
                     FROM personel p
                     JOIN pers_job_relation pjr
                       ON p.personel_id = pjr.personel_id
                     JOIN job j
                       ON pjr.job_id = j.id
                     """
             )) {

            while (rs.next()) {
                model.addRow(new Object[]{
                        rs.getInt("personel_id"),
                        rs.getString("ad"),
                        rs.getString("soyad"),
                        rs.getInt("kurum_id"),
                        rs.getString("job_name")
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
