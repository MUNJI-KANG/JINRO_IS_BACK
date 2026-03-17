import axios from 'axios';

// 공통 설정을 가진 axios 인스턴스 생성
const api = axios.create({
  //baseURL: 'http://localhost:8000', // 여기에 한 번만 적어주면 됩니다!
  //baseURL: 'https://3.26.222.34:8000', //http 
  baseURL: '/api', // https
  withCredentials: true,
  timeout: 120000,
});

export default api;