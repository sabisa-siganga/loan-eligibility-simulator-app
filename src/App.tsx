import { useCallback, useEffect } from 'react';

import { JourneyLayout } from './components/journey-layout';
import { Button } from './components/ui';
import { LoanDetailsScreen } from './screens/loan-details-screen';
import { YourDetailsScreen } from './screens/your-details-screen';
import { YourResultScreen } from './screens/your-result-screen';
import { getProducts } from './services/products';
import { getValidationRules } from './services/validationRules';
import {
  catalogLoadFailed,
  catalogLoadStarted,
  catalogLoadSucceeded,
  selectCatalog,
  selectCurrentScreen,
  useAppDispatch,
  useAppSelector,
} from './store';
import styles from './App.module.scss';

/**
 * Root shell: load products + validation rules once, then route by journey screen.
 * Loading and error states keep the journey layout chrome; success defaults to loan details.
 */
const App = () => {
  const dispatch = useAppDispatch();
  const catalog = useAppSelector(selectCatalog);
  const currentScreen = useAppSelector(selectCurrentScreen);

  /**
   * Fetch products and validation rules in parallel.
   * Fail on either endpoint error, or when the product list is empty.
   */
  const loadCatalog = useCallback(async () => {
    dispatch(catalogLoadStarted());

    const [productsResult, rulesResult] = await Promise.all([getProducts(), getValidationRules()]);

    if (!productsResult.ok) {
      dispatch(catalogLoadFailed(productsResult.message));
      return;
    }

    if (!rulesResult.ok) {
      dispatch(catalogLoadFailed(rulesResult.message));
      return;
    }

    if (productsResult.products.length === 0) {
      dispatch(catalogLoadFailed('No loan products are available right now.'));
      return;
    }

    dispatch(
      catalogLoadSucceeded({
        products: productsResult.products,
        validationRules: rulesResult.rules,
      }),
    );
  }, [dispatch]);

  /** Kick off catalog load when the store is still idle. */
  useEffect(() => {
    if (catalog.status === 'idle') {
      void loadCatalog();
    }
  }, [catalog.status, loadCatalog]);

  /** Idle or in-flight: show a polite loading status inside the journey shell. */
  if (catalog.status === 'idle' || catalog.status === 'loading') {
    return (
      <JourneyLayout currentStepId="loanDetails">
        <p className={styles.status} role="status" aria-live="polite">
          Loading loan products and validation rules…
        </p>
      </JourneyLayout>
    );
  }

  /** Load failed: show the error and a retry that re-runs loadCatalog. */
  if (catalog.status === 'error') {
    return (
      <JourneyLayout currentStepId="loanDetails">
        <div className={styles.errorPanel} role="alert">
          <p className={styles.errorText}>
            {catalog.errorMessage ?? 'Unable to load loan setup data.'}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void loadCatalog();
            }}
          >
            Retry
          </Button>
        </div>
      </JourneyLayout>
    );
  }

  /** Journey routing by currentScreen; default is loan details. */
  if (currentScreen === 'yourBudget') {
    return <YourDetailsScreen />;
  }

  if (currentScreen === 'yourResult') {
    return <YourResultScreen />;
  }

  return <LoanDetailsScreen />;
};

export default App;
