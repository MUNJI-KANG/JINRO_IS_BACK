import { createSlice } from '@reduxjs/toolkit';

const initialState = [];

export const cVideos = createSlice({
    name: 'cVideos',
    initialState,
    reducers: {
        addVideo: (state, action) => {
            state.push(action.payload);
        },

        deleteVideo: (state, action) => {
            return state.filter(video => video.id !== action.payload);
        },
    }
});

export const { addVideo, deleteVideo } = cVideos.actions;
export default cVideos.reducer;