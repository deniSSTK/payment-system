export class MoneyUtil {
  private static readonly MONEY_REGEX = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

  static toMinorUnits(value: string): string {
    if (!MoneyUtil.MONEY_REGEX.test(value)) {
      throw new Error('Amount must be a positive monetary value with up to 2 decimal places.');
    }

    const [whole, fraction = ''] = value.split('.');
    const normalizedFraction = `${fraction}00`.slice(0, 2);

    return (BigInt(whole) * 100n + BigInt(normalizedFraction)).toString();
  }

  static fromMinorUnits(value: string): string {
    const isNegative = value.startsWith('-');
    const absolute = isNegative ? value.slice(1) : value;
    const padded = absolute.padStart(3, '0');
    const whole = padded.slice(0, -2) || '0';
    const fraction = padded.slice(-2);

    return `${isNegative ? '-' : ''}${whole}.${fraction}`;
  }
}
