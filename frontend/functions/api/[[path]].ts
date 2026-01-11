const BACKEND_URL = "https://backend.kerke-2011.workers.dev";

export const onRequest: PagesFunction = async (context) => {
	const url = new URL(context.request.url);
	const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

	const headers = new Headers(context.request.headers);
	// 移除 host header，讓 fetch 使用目標 URL 的 host
	headers.delete("host");

	const requestInit: RequestInit = {
		method: context.request.method,
		headers,
		// 不自動跟隨重定向，讓客戶端處理
		redirect: "manual",
	};

	// 只有非 GET/HEAD 請求才傳遞 body
	if (!["GET", "HEAD"].includes(context.request.method)) {
		requestInit.body = context.request.body;
		// @ts-expect-error - duplex 是 Node.js fetch 需要的選項
		requestInit.duplex = "half";
	}

	const response = await fetch(backendUrl, requestInit);

	// 複製回應 headers
	const responseHeaders = new Headers(response.headers);

	// 處理重定向：將 backend URL 替換為 frontend URL
	const location = responseHeaders.get("location");
	if (location) {
		const newLocation = location.replace(BACKEND_URL, url.origin);
		responseHeaders.set("location", newLocation);
	}

	// 移除可能造成問題的 headers
	responseHeaders.delete("content-encoding");
	responseHeaders.delete("content-length");

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: responseHeaders,
	});
};
