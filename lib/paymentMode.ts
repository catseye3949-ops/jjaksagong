export const PAYMENT_MODES = ["nicepay-test", "nicepay-live"] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number];

export type PaymentModeResolution = {
  mode: PaymentMode;
  rawMode: string | null;
  isValid: boolean;
  isLive: boolean;
  isLiveBlockedOutsideProduction: boolean;
  isLiveBlockedInDevelopment: boolean;
};

export function resolvePaymentMode(
  rawMode = process.env.NEXT_PUBLIC_PAYMENT_MODE ?? process.env.PAYMENT_MODE ?? "",
  nodeEnv = process.env.NODE_ENV,
): PaymentModeResolution {
  const trimmed = rawMode.trim();
  const defaultMode: PaymentMode = "nicepay-test";
  const isValid = PAYMENT_MODES.includes(trimmed as PaymentMode);
  const mode = isValid ? (trimmed as PaymentMode) : defaultMode;
  const isLive = mode === "nicepay-live";
  const isLiveBlockedOutsideProduction = nodeEnv !== "production" && isLive;

  return {
    mode,
    rawMode: trimmed || null,
    isValid: !trimmed || isValid,
    isLive,
    isLiveBlockedOutsideProduction,
    isLiveBlockedInDevelopment: nodeEnv === "development" && isLive,
  };
}

export function getPaymentModeMessage(mode: PaymentMode): string {
  if (mode === "nicepay-live") {
    return "실결제 모드입니다. 실제 결제가 진행됩니다.";
  }
  return "PG 테스트결제 모드입니다. 실제 돈이 결제되지 않습니다.";
}
