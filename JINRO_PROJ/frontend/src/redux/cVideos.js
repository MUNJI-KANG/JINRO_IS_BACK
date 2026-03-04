import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

export const cVideos = createSlice({
  name: "cVideos",
  initialState,
  reducers: {

    addVideo: (state, action) => {

      const payload = action.payload;

      // 같은 영상 중복 방지
      const exist = state.find(v => v.id === payload.id);
      if (exist) return;

      // 최대 3개
      if (state.length >= 3) return;

      state.push(payload);
    },

    deleteVideo: (state, action) => {
      return state.filter(video => video.id !== action.payload);
    },

    clearVideos: () => {
      return [];
    }

  }
});

export const { addVideo, deleteVideo, clearVideos } = cVideos.actions;
export default cVideos.reducer;