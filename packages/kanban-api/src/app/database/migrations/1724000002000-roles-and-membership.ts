import { MigrationInterface, QueryRunner } from 'typeorm';

export class RolesAndMembership1724000002000 implements MigrationInterface {
  name = 'RolesAndMembership1724000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "system_role_enum" AS ENUM ('USER', 'ADMIN')`);
    await queryRunner.query(`ALTER TABLE "users" ADD "system_role" "system_role_enum" NOT NULL DEFAULT 'USER'`);
    await queryRunner.query(`CREATE TYPE "board_member_role_enum" AS ENUM ('ADMIN', 'MEMBER', 'VIEWER')`);
    await queryRunner.query(`CREATE TABLE "board_members" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "board_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "board_member_role_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_board_members" PRIMARY KEY ("id"), CONSTRAINT "UQ_board_members_board_user" UNIQUE ("board_id", "user_id"), CONSTRAINT "FK_board_members_board" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE, CONSTRAINT "FK_board_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX "IDX_board_members_user_role" ON "board_members" ("user_id", "role")`);
    await queryRunner.query(`CREATE INDEX "IDX_board_members_board_role" ON "board_members" ("board_id", "role")`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD "assignee_id" uuid`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_assignee" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_tasks_assignee" ON "tasks" ("assignee_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_tasks_assignee"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_assignee"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "assignee_id"`);
    await queryRunner.query(`DROP INDEX "IDX_board_members_board_role"`);
    await queryRunner.query(`DROP TABLE "board_members"`);
    await queryRunner.query(`DROP TYPE "board_member_role_enum"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "system_role"`);
    await queryRunner.query(`DROP TYPE "system_role_enum"`);
  }
}
