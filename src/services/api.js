import axios from 'axios';

const api = axios.create({
	baseURL: 'http://localhost:3000',
});

let authToken = null;
let unauthorizedHandler = null;

function setAuthToken(token) {
	authToken = token || null;
}

function clearAuthToken() {
	authToken = null;
}

function setUnauthorizedHandler(handler) {
	unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

api.interceptors.request.use((config) => {
	if (authToken) {
		config.headers = {
			...config.headers,
			Authorization: `Bearer ${authToken}`,
		};
	}

	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error?.response?.status === 401 && unauthorizedHandler) {
			unauthorizedHandler();
		}

		return Promise.reject(error);
	}
);

export default api;
export { setAuthToken, clearAuthToken, setUnauthorizedHandler };
