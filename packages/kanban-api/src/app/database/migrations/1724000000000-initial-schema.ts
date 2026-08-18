import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1724000000000 implements MigrationInterface {
  name = 'InitialSchema1724000000000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await q.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar(120) NOT NULL, "email" varchar(320) NOT NULL, "password_hash" varchar NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_users" PRIMARY KEY ("id"), CONSTRAINT "UQ_users_email" UNIQUE ("email"))`);
    await q.query(`CREATE TABLE "boards" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar(160) NOT NULL, "description" text, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_boards" PRIMARY KEY ("id"), CONSTRAINT "FK_boards_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`);
    await q.query(`CREATE INDEX "IDX_boards_user" ON "boards" ("user_id")`);
    await q.query(`CREATE TABLE "columns" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" varchar(120) NOT NULL, "position" integer NOT NULL, "board_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_columns" PRIMARY KEY ("id"), CONSTRAINT "FK_columns_board" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE)`);
    await q.query(`CREATE INDEX "IDX_columns_order" ON "columns" ("board_id", "position")`);
    await q.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "title" varchar(200) NOT NULL, "description" text, "position" integer NOT NULL, "column_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tasks" PRIMARY KEY ("id"), CONSTRAINT "FK_tasks_column" FOREIGN KEY ("column_id") REFERENCES "columns"("id") ON DELETE CASCADE)`);
    await q.query(`CREATE INDEX "IDX_tasks_order" ON "tasks" ("column_id", "position")`);
    await q.query(`CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "original_name" varchar(255) NOT NULL, "storage_key" varchar NOT NULL, "mime_type" varchar(100) NOT NULL, "size" bigint NOT NULL, "task_id" uuid NOT NULL, "uploader_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_attachments" PRIMARY KEY ("id"), CONSTRAINT "UQ_attachments_key" UNIQUE ("storage_key"), CONSTRAINT "FK_attachments_task" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE, CONSTRAINT "FK_attachments_uploader" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE CASCADE)`);
    await q.query(`CREATE INDEX "IDX_attachments_task" ON "attachments" ("task_id")`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "attachments"`); await q.query(`DROP TABLE "tasks"`); await q.query(`DROP TABLE "columns"`); await q.query(`DROP TABLE "boards"`); await q.query(`DROP TABLE "users"`);
  }
}
