const { Client } = require('pg');
require('dotenv').config();

function normalizeConnectionString(rawUri) {
  if (!rawUri) return rawUri;
  const directMatch = rawUri.match(/^postgresql:\/\/([^:]+):([^@]+)@db\.([a-zA-Z0-9_-]+)\.supabase\.co(?::(\d+))?\/([^\s?]+)(.*)$/);
  if (directMatch) {
    const [, user, password, projectRef, port, dbName, queryParams] = directMatch;
    const poolerUser = user === 'postgres' ? `postgres.${projectRef}` : user;
    const poolerPort = port || '5432';
    return `postgresql://${poolerUser}:${password}@aws-0-us-east-1.pooler.supabase.com:${poolerPort}/${dbName}${queryParams || ''}`;
  }
  return rawUri;
}

const rawUri = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!rawUri) {
  console.error('Please specify DATABASE_URL or POSTGRES_URL in your .env file');
  process.exit(1);
}
const connectionString = normalizeConnectionString(rawUri);

const rawCsvData = `00,Candelaria,pendiente,0,Cargado de lista inicial
01,Claudia,pendiente,0,
02,Hijo 🥰,pendiente,0,Cargado de lista inicial
03,Anyela,pendiente,0,Cargado de lista inicial
04,Britney,pendiente,0,Cargado de lista inicial
05,Vivi,pagado,10000,Cargado de lista inicial
06,Milagro,pendiente,0,Cargado de lista inicial
07,Diosimar,pendiente,0,Cargado de lista inicial
08,Yesiris,pendiente,0,Cargado de lista inicial
09,Marta puente,pendiente,0,Cargado de lista inicial
10,Julio❤️,pendiente,0,Cargado de lista inicial
11,Leniz,pendiente,0,Cargado de lista inicial
12,Vivi,pagado,10000,Cargado de lista inicial
13,Julio❤️,pendiente,0,Cargado de lista inicial
14,Flor,pagado,10000,Cargado de lista inicial
15,Marta puente,pendiente,0,Cargado de lista inicial
16,,disponible,0,
17,Julio❤️,pendiente,0,Cargado de lista inicial
18,,disponible,0,
19,,disponible,0,
20,Luciana,pendiente,0,Cargado de lista inicial
21,Aide,pendiente,0,Cargado de lista inicial
22,Katy martinez,pendiente,0,Cargado de lista inicial
23,Chucho,pendiente,0,Cargado de lista inicial
24,Sivied,pendiente,0,Cargado de lista inicial
25,,disponible,0,
26,Miriam,pendiente,0,Cargado de lista inicial
27,Doris,pendiente,0,Cargado de lista inicial
28,,disponible,0,
29,Vivi,pagado,10000,Cargado de lista inicial
30,Denis,pendiente,0,Cargado de lista inicial
31,Yésica galleta,pendiente,0,Cargado de lista inicial
32,,disponible,0,
33,Julio❤️,pendiente,0,Cargado de lista inicial
34,,disponible,0,
35,,disponible,0,
36,,disponible,0,
37,Lily,pendiente,0,Cargado de lista inicial
38,Julio❤️,pendiente,0,Cargado de lista inicial
39,,disponible,0,
40,Esledi,pendiente,0,Cargado de lista inicial
41,,disponible,0,
42,,disponible,0,
43,,disponible,0,
44,,disponible,0,
45,Heidy💕,pendiente,0,Cargado de lista inicial
46,,disponible,0,
47,Candelaria,pendiente,0,Cargado de lista inicial
48,Heidy💕,pendiente,0,Cargado de lista inicial
49,,disponible,0,
50,,disponible,0,
51,,disponible,0,
52,Heidy 💕,pendiente,0,Cargado de lista inicial
53,,disponible,0,
54,,disponible,0,
55,Vecino Jorge,pagado,10000,Cargado de lista inicial
56,Julio ❤️,pendiente,0,Cargado de lista inicial
57,Julio ❤️,pendiente,0,Cargado de lista inicial
58,,disponible,0,
59,,disponible,0,
60,,disponible,0,
61,,disponible,0,
62,,disponible,0,
63,Cande,pendiente,0,Cargado de lista inicial
64,Ledis,pendiente,0,Cargado de lista inicial
65,,disponible,0,
66,Didier,pendiente,0,Cargado de lista inicial
67,Magola,pendiente,0,Cargado de lista inicial
68,Linda,pendiente,0,Cargado de lista inicial
69,Valeri Avila,pagado,10000,
70,,disponible,0,
71,,disponible,0,
72,Valentina cabas,pagado,10000,
73,María José,pendiente,0,Cargado de lista inicial
74,Carmencita,pendiente,0,Cargado de lista inicial
75,,disponible,0,
76,Salvadora,pendiente,0,Cargado de lista inicial
77,Julio❤️,pendiente,0,Cargado de lista inicial
78,Yesiris,pendiente,0,Cargado de lista inicial
79,,disponible,0,
80,,disponible,0,
81,,disponible,0,
82,,disponible,0,
83,Heidy💕,pendiente,0,Cargado de lista inicial
84,Josué 1,pendiente,0,Cargado de lista inicial
85,Niño,pendiente,0,Cargado de lista inicial
86,,disponible,0,
87,Mary cruz,pendiente,0,Cargado de lista inicial
88,Julio ❤️,pendiente,0,Cargado de lista inicial
89,Heidy 💕,pendiente,0,Cargado de lista inicial
90,Chino vecino,pendiente,0,Cargado de lista inicial
91,,disponible,0,
92,,disponible,0,
93,Waso,pendiente,0,Cargado de lista inicial
94,,disponible,0,
95,Yenny,pendiente,0,Cargado de lista inicial
96,,disponible,0,
97,Lily,pendiente,0,Cargado de lista inicial
98,Monica,pendiente,0,Cargado de lista inicial
99,Julio ❤️,pendiente,0,Cargado de lista inicial`;

async function migrate() {
  console.log('Connecting to remote Supabase database...');
  console.log('Host: aws-0-us-east-1.pooler.supabase.com:5432');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL database.');

    console.log('Creating table schema if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        ticket_number VARCHAR(2) PRIMARY KEY,
        buyer_name VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'pendiente', 'abono', 'pagado')),
        amount_paid INTEGER NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
        notes TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_buyer ON tickets(buyer_name);
    `);

    console.log('Upserting all 100 tickets with latest active data...');
    await client.query('BEGIN');

    const lines = rawCsvData.trim().split('\n');
    let upsertedCount = 0;

    for (const line of lines) {
      const parts = line.split(',');
      const num = parts[0].trim();
      const name = parts[1].trim() || null;
      const status = parts[2].trim();
      const amount = parseInt(parts[3].trim() || '0', 10);
      const notes = parts[4] ? parts[4].trim() : null;

      await client.query(
        `INSERT INTO tickets (ticket_number, buyer_name, status, amount_paid, notes, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (ticket_number) DO UPDATE
         SET buyer_name = EXCLUDED.buyer_name,
             status = EXCLUDED.status,
             amount_paid = EXCLUDED.amount_paid,
             notes = EXCLUDED.notes,
             updated_at = CURRENT_TIMESTAMP;`,
        [num, name, status, amount, notes]
      );
      upsertedCount++;
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully saved and synced all ${upsertedCount} tickets into Supabase!`);

    // Verify statistics in Supabase
    const statsRes = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE buyer_name IS NOT NULL) AS sold,
        COUNT(*) FILTER (WHERE buyer_name IS NULL) AS available,
        COUNT(*) FILTER (WHERE status = 'pagado') AS paid,
        COUNT(*) FILTER (WHERE status = 'pendiente') AS pending,
        COALESCE(SUM(amount_paid), 0) AS total_collected
      FROM tickets;
    `);

    console.log('\n📊 Supabase Database Verification:');
    console.table(statsRes.rows);

    await client.end();
  } catch (err) {
    console.error('Migration failed:', err);
    try { await client.query('ROLLBACK'); } catch (e) {}
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
}

migrate();
