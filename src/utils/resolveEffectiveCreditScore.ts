export type ResolveEffectiveCreditScoreInput = {
  readonly entered: number | null | undefined;
  readonly creditCheckScore: number | null | undefined;
  readonly creditCheckOptIn: boolean;
};

/**
 * Single source of truth for which score feeds rate/eligibility calls.
 * Manual entry wins; bureau score is used only when the user opted in and a
 * check result exists. Otherwise credit is omitted from the request.
 */
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
