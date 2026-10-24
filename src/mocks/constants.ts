/**
 * sessionStorage flag (`'1'`) that forces the eligibility Mock Service Worker handler to 500.
 * Used by tests/demos to exercise the unavailable-result path without changing
 * scoring logic.
 */
export const MOCK_ELIGIBILITY_FAIL_STORAGE_KEY = 'mockApi.eligibilityFail';
