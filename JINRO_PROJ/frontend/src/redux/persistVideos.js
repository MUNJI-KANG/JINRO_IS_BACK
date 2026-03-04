export const loadVideos = () => {
  try {
    const data = localStorage.getItem("selectedVideos");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveVideos = (videos) => {
  localStorage.setItem("selectedVideos", JSON.stringify(videos));
};