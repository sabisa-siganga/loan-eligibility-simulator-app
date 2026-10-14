export type ResolveEffectiveCreditScoreInput = {
  readonly entered: number | null | undefined;
  readonly creditCheckScore: number | null | undefined;
};

export const resolveEffectiveCreditScore = ({
  entered,
  creditCheckScore,
}: ResolveEffectiveCreditScoreInput): number | undefined => {
  if (typeof entered === 'number' && Number.isFinite(entered)) {
    return entered;
  }

  if (typeof creditCheckScore === 'number' && Number.isFinite(creditCheckScore)) {
    return creditCheckScore;
  }

  return undefined;
};
