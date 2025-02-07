import { configureStore } from '@reduxjs/toolkit'
import { enableMapSet } from 'immer'
import { courseReducer, courseTakenReducer, globalReducer, termsReducer, planReducer } from './slices';
import { errorMiddleware, localStorageMiddleware, planSyncMiddleware } from './middlewares';

enableMapSet();

// for possible future SSR support
export const makeStore = () => {
  return configureStore({
    reducer: {
      courses: courseReducer,
      terms: termsReducer,
      global: globalReducer,
      courseTaken: courseTakenReducer,
      plans: planReducer,
    },
    middleware: (getDefaultMiddleware) => 
      getDefaultMiddleware()
        .prepend(errorMiddleware)
        .concat(localStorageMiddleware) // update at return
        .concat(planSyncMiddleware)
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
export type RootState = ReturnType<AppStore['getState']>
