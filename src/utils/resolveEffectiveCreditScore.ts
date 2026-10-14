export type ResolveEffectiveCreditScoreInput = {
  readonly entered: number | null | undefined;
  readonly creditCheckScore: number | null | undefined;
  readonly creditCheckOptIn: boolean;
};

export const resolveEffectiveCreditScore = ({
  entered,
  creditCheckScore,
  creditCheckOptIn,
}: ResolveEffectiveCreditScoreInput): number | undefined => {
  if (typeof entered === 'number' && Number.isFinite(entered)) {
    return entered;
  }

  if (
    creditCheckOptIn &&
    typeof creditCheckScore === 'number' &&
    Number.isFinite(creditCheckScore)
  ) {
    return creditCheckScore;
  }

  return undefined;
};
