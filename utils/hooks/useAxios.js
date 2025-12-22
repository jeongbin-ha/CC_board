import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '@/utils/apis/axiosInstance';

const useAxios = () => {
	const navigate = useNavigate();

	const requestInterceptor = useCallback((config) => {
		const accessToken = localStorage.getItem('accessToken');
		if (accessToken) {
			config.headers.Authorization = `Bearer ${accessToken}`;
		}
		return config;
	}, []);

	const responseInterceptor = useCallback(
		async (error) => {
			const originalRequest = error.config;

			// accessToken 만료 시
			if (error.response?.status === 401 && !originalRequest._retry) {
				originalRequest._retry = true;
				const refreshToken = localStorage.getItem('refreshToken');

				if (!refreshToken) {
					console.error('refreshToken 없음 → 로그인 페이지로 이동');
					navigate('/login', { replace: true });
					return Promise.reject(error);
				}

				try {
					originalRequest.headers.Authorization = `Bearer ${refreshToken}`;
					return axiosInstance(originalRequest);
				} catch (refreshError) {
					console.error('refreshToken도 만료 → 로그인 페이지로 이동');
					navigate('/login', { replace: true });
					return Promise.reject(refreshError);
				}
			}

			return Promise.reject(error);
		},
		[navigate],
	);

	useEffect(() => {
		const req = axiosInstance.interceptors.request.use(requestInterceptor);
		const res = axiosInstance.interceptors.response.use(
			(response) => response,
			responseInterceptor,
		);

		return () => {
			axiosInstance.interceptors.request.eject(req);
			axiosInstance.interceptors.response.eject(res);
		};
	}, [requestInterceptor, responseInterceptor]);

	return axiosInstance;
};

export default useAxios;
