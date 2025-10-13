addEventListener('fetch', (event) => {
	event.respondWith(handleRequest(event.request));
});

function sendResponse(status, statusText, body, headers) {
	return new Response(body || statusText, {
		status: status,
		statusText: statusText,
		headers: headers,
	});
}

async function handleRequest(request) {
	if (request.method.toUpperCase() !== 'POST') {
		return sendResponse(404, 'Not Found');
	}

	const contentType = request.headers.get('content-type');
	if (!contentType || !contentType.includes('application/json')) {
		return sendResponse(400, 'Content-Type: application/json is required');
	}

	const proxySecret = request.headers.get('X-PROXY-SECRET');
	if (proxySecret !== SECRET) {
		return sendResponse(403, 'Invalid secret');
	}

	let params = null;
	try {
		params = await request.json();
	} catch (err) {
		return sendResponse(400, 'Invalid params');
	}

	const url = params['url'];
	if (!url) {
		return sendResponse(400, 'URL is required');
	}

	const res = await fetch(decodeURIComponent(url), {
		method: 'GET',
		redirect: 'follow',
		keepalive: true,
	});

	const headers = new Headers(res.headers);
	headers.set('x-request-url', res.url);

	return sendResponse(res.status, res.statusText, res.body, headers);
}
