import pg from 'pg';
import fs from 'fs';

const pool = new pg.Pool({
    host: 'localhost',
    port: 5432,
    database: 'ERR_Cafe',
    user: 'postgres',
    password: 'ThEFETncr.2023'
});

async function run() {
    const client = await pool.connect();
    try {
        const sql = fs.readFileSync('../../trigger.sql', 'utf8');
        console.log('Executing SQL:', sql);
        await client.query(sql);
        console.log('Trigger created successfully!');
    } catch (err) {
        console.error('Error creating trigger:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
