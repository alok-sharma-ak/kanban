import { MigrationInterface, QueryRunner } from 'typeorm';

export class Hardening1724000001000 implements MigrationInterface {
  name = 'Hardening1724000001000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "columns" ADD CONSTRAINT "CHK_columns_position" CHECK ("position" > 0)`);
    await q.query(`ALTER TABLE "tasks" ADD CONSTRAINT "CHK_tasks_position" CHECK ("position" > 0)`);
    await q.query(`ALTER TABLE "columns" ADD CONSTRAINT "UQ_columns_board_position" UNIQUE ("board_id", "position") DEFERRABLE INITIALLY DEFERRED`);
    await q.query(`ALTER TABLE "tasks" ADD CONSTRAINT "UQ_tasks_column_position" UNIQUE ("column_id", "position") DEFERRABLE INITIALLY DEFERRED`);
    await q.query(`CREATE TABLE "storage_cleanup_jobs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "object_key" varchar NOT NULL, "status" varchar(20) NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT 0, "next_attempt_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "last_error" text, "completed_at" TIMESTAMPTZ, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_storage_cleanup_jobs" PRIMARY KEY ("id"), CONSTRAINT "CHK_cleanup_status" CHECK ("status" IN ('pending','processing','completed','failed')))`);
    await q.query(`CREATE INDEX "IDX_cleanup_due" ON "storage_cleanup_jobs" ("status", "next_attempt_at")`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE "storage_cleanup_jobs"`);
    await q.query(`ALTER TABLE "tasks" DROP CONSTRAINT "UQ_tasks_column_position"`);
    await q.query(`ALTER TABLE "columns" DROP CONSTRAINT "UQ_columns_board_position"`);
    await q.query(`ALTER TABLE "tasks" DROP CONSTRAINT "CHK_tasks_position"`);
    await q.query(`ALTER TABLE "columns" DROP CONSTRAINT "CHK_columns_position"`);
  }
}
