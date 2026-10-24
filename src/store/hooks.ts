import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from './store';

/** Typed `useDispatch` bound to this app's `AppDispatch`. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/** Typed `useSelector` bound to this app's `RootState`. */
export const useAppSelector = useSelector.withTypes<RootState>();
