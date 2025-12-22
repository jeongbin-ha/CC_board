import axios from 'axios';

const axiosInstance = axios.create({
	baseURL: import.meta.env.VITE_APP_API_URL,
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json',
	},
});

export { axiosInstance };
