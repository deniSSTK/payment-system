import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountCurrency1711990000000 implements MigrationInterface {
  name = 'AddAccountCurrency1711990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD "currency" character varying NOT NULL DEFAULT 'USD'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "currency"`);
  }
}
