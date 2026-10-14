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

const App = () => {
  const dispatch = useAppDispatch();
  const catalog = useAppSelector(selectCatalog);
  const currentScreen = useAppSelector(selectCurrentScreen);

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

  useEffect(() => {
    if (catalog.status === 'idle') {
      void loadCatalog();
    }
  }, [catalog.status, loadCatalog]);

  if (catalog.status === 'idle' || catalog.status === 'loading') {
    return (
      <JourneyLayout currentStepId="loanDetails">
        <p className={styles.status} role="status" aria-live="polite">
          Loading loan products and validation rules…
        </p>
      </JourneyLayout>
    );
  }

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

  if (currentScreen === 'yourBudget') {
    return <YourDetailsScreen />;
  }

  if (currentScreen === 'yourResult') {
    return <YourResultScreen />;
  }

  return <LoanDetailsScreen />;
};

export default App;
