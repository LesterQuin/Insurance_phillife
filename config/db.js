import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        encrypt: false,           // true if using Azure
        trustServerCertificate: true
    }
};

export const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed:', err);
        throw err;
    });

export { sql };

// git remote add origin https://github.com/LesterQuin/Insurance_phillife.git
// git branch -M main
// git push -u origin main