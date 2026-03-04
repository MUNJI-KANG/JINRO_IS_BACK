import { createSlice } from "@reduxjs/toolkit";
import { loadVideos, saveVideos } from "./persistVideos";

const cVideosSlice = createSlice({
  name: "cVideos",
  initialState: loadVideos(),

  reducers: {

    addVideo: (state, action) => {

      const newVideos = action.payload;

      newVideos.forEach((video) => {

        const exists = state.find((v) => v.id === video.id);

        if (!exists) {
          state.push(video);
        }

      });

      saveVideos(state);
    },

    deleteVideo: (state, action) => {

      const newState = state.filter(
        (video) => video.id !== action.payload
      );

      saveVideos(newState);

      return newState;
    },

    clearVideos: () => {

      localStorage.removeItem("selectedVideos");

      return [];
    }

  }

});

export const { addVideo, deleteVideo, clearVideos } = cVideosSlice.actions;

export default cVideosSlice.reducer;