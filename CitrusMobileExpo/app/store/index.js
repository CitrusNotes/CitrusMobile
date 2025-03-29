import { configureStore } from '@reduxjs/toolkit';

// Import reducers here
// import fileReducer from './slices/fileSlice';

export const store = configureStore({
  reducer: {
    // Add reducers here
    // files: fileReducer,
  },
});

export default store; 