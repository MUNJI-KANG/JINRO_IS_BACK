import { configureStore } from '@reduxjs/toolkit';
import cVideos from './cVideos.js';

export const store = configureStore({
  reducer: {
    cVideos: cVideos, 
  },
});