import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1711970000000 implements MigrationInterface {
  name = 'InitialSchema1711970000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE TYPE "public"."roles_name_enum" AS ENUM('Admin', 'Client')`);
    await queryRunner.query(
      `CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" "public"."roles_name_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "refresh_token_hash" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "role_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "balance" bigint NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_accounts_user_id" UNIQUE ("user_id"),
        CONSTRAINT "PK_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_accounts_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."transactions_status_enum" AS ENUM('Pending', 'Completed', 'Canceled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "source_account_id" uuid NOT NULL,
        "destination_account_id" uuid NOT NULL,
        "initiated_by_user_id" uuid NOT NULL,
        "amount" bigint NOT NULL,
        "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'Pending',
        "description" character varying(255),
        "failure_reason" character varying(255),
        "processed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_source_account_id" FOREIGN KEY ("source_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_transactions_destination_account_id" FOREIGN KEY ("destination_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_transactions_initiated_by_user_id" FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )`,
    );

    await queryRunner.query(`CREATE INDEX "IDX_transactions_status" ON "transactions" ("status")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_created_at" ON "transactions" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_source_account_id" ON "transactions" ("source_account_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_destination_account_id" ON "transactions" ("destination_account_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_transactions_destination_account_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transactions_source_account_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transactions_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transactions_status"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TYPE "public"."roles_name_enum"`);
  }
}
