import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { OutboxService } from './app/infrastructure/outbox.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  await app.get(OutboxService).process(100);
  await app.close();
}
void run();
