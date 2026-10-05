export const MCU_SCALE = 6;
export const MCU_MAX_MINOR = BigInt(10) ** BigInt(38) - BigInt(1);

const integerPattern = /^-?(0|[1-9][0-9]*)$/;

export class QuantityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuantityError";
  }
}

export function parseMcu(value: string): bigint {
  if (typeof value !== "string" || !integerPattern.test(value)) {
    throw new QuantityError("MCU amounts must be canonical integer strings.");
  }
  const amount = BigInt(value);
  if (amount > MCU_MAX_MINOR || amount < -MCU_MAX_MINOR) throw new QuantityError("MCU amount is outside the safe range.");
  return amount;
}

export function formatMcu(value: bigint) {
  if (typeof value !== "bigint") throw new QuantityError("MCU arithmetic requires bigint.");
  if (value > MCU_MAX_MINOR || value < -MCU_MAX_MINOR) throw new QuantityError("MCU amount is outside the safe range.");
  return value.toString();
}

export function addMcu(left: bigint, right: bigint) {
  return formatMcu(parseMcu(formatMcu(left)) + parseMcu(formatMcu(right)));
}
