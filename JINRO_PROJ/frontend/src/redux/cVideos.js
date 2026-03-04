import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

export const cVideos = createSlice({
  name: "cVideos",
  initialState,
  reducers: {
    addVideo: (state, action) => {
      const payload = action.payload; // {id, mainCategory, subCategory, url ...}

      // 1) 같은 영상(id) 이미 있으면 무시
      const sameId = state.find((v) => v.id === payload.id);
      if (sameId) return;

      // 2) 같은 대분류(mainCategory)에서 이미 선택한 게 있으면 "교체"
      const sameMainIdx = state.findIndex(
        (v) => v.mainCategory === payload.mainCategory
      );
      if (sameMainIdx !== -1) {
        state[sameMainIdx] = payload;
        return;
      }

      // 3) 최대 3개
      if (state.length >= 3) return;

      state.push(payload);
    },

    deleteVideo: (state, action) => {
      return state.filter((video) => video.id !== action.payload);
    },

    clearVideos: () => {
      return [];
    },
  },
});

export const { addVideo, deleteVideo, clearVideos } = cVideos.actions;
export default cVideos.reducer;