import axios from 'axios';

const api = axios.create({
	baseURL: 'http://localhost:3000',
});

let authSession = null;
let unauthorizedHandler = null;

/** Stores auth credentials so the request interceptor can attach them as headers. */
function setAuthSession(session) {
	if (!session) {
		authSession = null;
		return;
	}

	authSession = {
		token: session.token || null,
		userId: session.userId || null,
		userRole: session.userRole || null,
		userName: session.userName || null,
	};
}

function clearAuthSession() {
	authSession = null;
}

/** Registers a callback invoked by the response interceptor on 401 (used for auto-logout). */
function setUnauthorizedHandler(handler) {
	unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

api.interceptors.request.use((config) => {
	if (authSession) {
		config.headers = {
			...config.headers,
			...(authSession.userRole ? { 'x-user-role': authSession.userRole } : {}),
			...(authSession.userId ? { 'x-user-id': String(authSession.userId) } : {}),
			...(authSession.userName ? { 'x-user-name': authSession.userName } : {}),
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
