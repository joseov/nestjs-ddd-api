import { DataSource, DataSourceOptions } from 'typeorm';
import { resolve } from 'path';

const dbOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // We use glob patterns to find Entity paths automatically over the DDD folders
  entities: [resolve(process.cwd(), 'src/modules/**/infrastructure/*.orm-entity{.ts,.js}')],
  migrations: [resolve(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false, // Migrations should be handled manually via CLI
};

if (process.env.DB_USE_SSL === 'true') {
  Object.assign(dbOptions, {
    ssl: {
      rejectUnauthorized: process.env.DB_SSL_CERT ? true : false,
      ca: process.env.DB_SSL_CERT,
    },
  });
}

// Export the TypeORM DataSource for its CLI to consume
export default new DataSource(dbOptions);
