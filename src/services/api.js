import axios from 'axios';

const api = axios.create({
	baseURL: 'http://localhost:3000',
});

let authSession = null;
let unauthorizedHandler = null;

function setAuthSession(session) {
	if (!session) {
		authSession = null;
		return;
	}

	authSession = {
		token: session.token || null,
		userId: session.userId || null,
		userRole: session.userRole || null,
	};
}

function clearAuthSession() {
	authSession = null;
}

function setUnauthorizedHandler(handler) {
	unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

api.interceptors.request.use((config) => {
	if (authSession) {
		config.headers = {
			...config.headers,
			...(authSession.userRole ? { 'x-user-role': authSession.userRole } : {}),
			...(authSession.userId ? { 'x-user-id': String(authSession.userId) } : {}),
			...(authSession.token ? { Authorization: `Bearer ${authSession.token}` } : {}),
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
export { setAuthSession, clearAuthSession, setUnauthorizedHandler };
