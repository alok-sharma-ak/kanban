import 'reflect-metadata';
import dataSource from './app/database/data-source';
import { SystemRole } from './app/common/roles';
import { User } from './app/users/entities/user.entity';

function emailArgument(): string | undefined {
  const index = process.argv.indexOf('--email');
  return index >= 0 ? process.argv[index + 1]?.trim().toLowerCase() : undefined;
}

async function main(): Promise<void> {
  const email = emailArgument();
  if (!email) throw new Error('Usage: pnpm admin:promote -- --email user@example.com');
  await dataSource.initialize();
  const repository = dataSource.getRepository(User);
  const user = await repository.findOne({ where: { email } });
  if (!user) throw new Error(`User not found: ${email}`);
  if (user.systemRole !== SystemRole.ADMIN) {
    user.systemRole = SystemRole.ADMIN;
    await repository.save(user);
  }
  process.stdout.write(`Promoted ${email} to system ADMIN\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}).finally(async () => {
  if (dataSource.isInitialized) await dataSource.destroy();
});
