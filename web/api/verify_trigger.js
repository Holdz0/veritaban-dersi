import pg from 'pg';

const pool = new pg.Pool({
    host: 'localhost',
    port: 5432,
    database: 'ERR_Cafe',
    user: 'postgres',
    password: 'ThEFETncr.2023'
});

async function verify() {
    const client = await pool.connect();
    try {
        // 1. Get initial count for a waiter (let's say ID 1, assuming they exist via pers_job_relation)
        // First find a valid relationship ID for waiter 1
        const relRes = await client.query('SELECT id, process_count FROM pers_job_relation LIMIT 1');
        const relId = relRes.rows[0].id;
        const initialCount = relRes.rows[0].process_count;
        console.log(`Initial Count for Rel ID ${relId}: ${initialCount}`);

        // 2. Create a customer associated with this waiter relationship
        const custRes = await client.query('INSERT INTO customer (garson_id) VALUES ($1) RETURNING id', [relId]);
        const custId = custRes.rows[0].id;

        // 3. Create an order (This should trigger the update)
        // Need a valid table ID, let's assume 1 exists
        await client.query('INSERT INTO siparis (table_id, customer_id) VALUES (1, $1)', [custId]);
        console.log('Order created.');

        // 4. Check count again
        const checkRes = await client.query('SELECT process_count FROM pers_job_relation WHERE id = $1', [relId]);
        const finalCount = checkRes.rows[0].process_count;
        console.log(`Final Count for Rel ID ${relId}: ${finalCount}`);

        if (finalCount === initialCount + 1) {
            console.log('SUCCESS: Trigger worked correctly!');
        } else {
            console.error('FAILURE: Trigger did not update count.');
        }

    } catch (err) {
        console.error('Test Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

verify();
