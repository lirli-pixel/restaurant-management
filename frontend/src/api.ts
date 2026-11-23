import axios from 'axios';

export const api = axios.create({
baseURL: 'http://localhost:3000/api'
});

api.interceptors.request.use(config => {
const token = sessionStorage.getItem('token');
if (token) {
config.headers.Authorization = `Bearer ${token}`;
}
return config; 

});

export function saveSession(data: any) {
sessionStorage.setItem('token', data.accessToken);
sessionStorage.setItem('user', JSON.stringify(data.user));
}

export function getUser() {
try {
return JSON.parse(sessionStorage.getItem('user') || 'null');
} catch {
return null;
}
}

export function logout() {
sessionStorage.removeItem('token');
sessionStorage.removeItem('user');
location.href = '/';
}