export async function ApiRequest(url, options = {}) {
    const response = await fetch(url, {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        credentials: "include",
    });

    if (response.status === 401) {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        if (window.navigateTo && window.location.pathname !== '/login') window.navigateTo('/login');
        throw new Error("Unauthorized");
    }
    if (!response.ok) {
        const err = new Error(`HTTP Error: ${response.status}`);
        err.status = response.status;
        throw err;
    }
    return await response.json();
}