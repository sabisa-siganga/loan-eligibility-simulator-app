/**
 * Inputs for deciding which credit score feeds rate and eligibility requests.
 */
export type ResolveEffectiveCreditScoreInput = {
  readonly entered: number | null | undefined;
  readonly creditCheckScore: number | null | undefined;
  readonly creditCheckOptIn: boolean;
};

/**
 * Pick the credit score that should be sent to rate/eligibility APIs.
 *
 * Manual entry wins when it is a finite number. Otherwise the bureau score
 * is used only when the user opted in and a finite check result exists.
 * If neither applies, credit is omitted from the request (undefined).
 */
export const resolveEffectiveCreditScore = ({
  entered,
  creditCheckScore,
  creditCheckOptIn,
}: ResolveEffectiveCreditScoreInput): number | undefined => {
  /**
   * Prefer a manually entered finite score over any bureau result.
   */
  if (typeof entered === 'number' && Number.isFinite(entered)) {
    return entered;
  }

  /**
   * Use the bureau score when the user opted in and a finite result is available.
   */
  if (
    creditCheckOptIn &&
    typeof creditCheckScore === 'number' &&
    Number.isFinite(creditCheckScore)
  ) {
    return creditCheckScore;
  }

  return undefined;
};
