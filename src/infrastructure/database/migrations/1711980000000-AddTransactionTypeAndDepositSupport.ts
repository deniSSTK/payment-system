import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTransactionTypeAndDepositSupport1711980000000 implements MigrationInterface {
  name = 'AddTransactionTypeAndDepositSupport1711980000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_type_enum" AS ENUM('Transfer', 'Deposit')`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "type" "public"."transactions_type_enum" NOT NULL DEFAULT 'Transfer'`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "source_account_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "source_account_id" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
  }
}
