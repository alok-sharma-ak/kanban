import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { ENTITIES } from './entities';
import { InitialSchema1724000000000 } from './migrations/1724000000000-initial-schema';

config({ path: 'packages/kanban-api/.env' });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ENTITIES,
  migrations: [InitialSchema1724000000000],
  synchronize: false,
});
