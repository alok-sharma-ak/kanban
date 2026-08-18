import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { ENTITIES } from './entities';
import { InitialSchema1724000000000 } from './migrations/1724000000000-initial-schema';
import { Hardening1724000001000 } from './migrations/1724000001000-hardening';
import { RolesAndMembership1724000002000 } from './migrations/1724000002000-roles-and-membership';

config({ path: 'packages/kanban-api/.env' });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ENTITIES,
  migrations: [InitialSchema1724000000000, Hardening1724000001000, RolesAndMembership1724000002000],
  synchronize: false,
});
