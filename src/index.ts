export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		const origin = request.headers.get("Origin");

		function isAllowedOrigin(origin: string | null): boolean {
			if (!origin) return false;
			if (
				origin === "http://localhost:3000" ||
				origin === "http://127.0.0.1:3000"
			) return true;

			const osucDevRegex = /^https:\/\/([a-z0-9-]+\.)?osuc\.dev$/;
			const pagesDevRegex = /^https:\/\/([a-z0-9-]+\.)?pages\.dev$/;
			return osucDevRegex.test(origin) || pagesDevRegex.test(origin);
		}

		// ✅ Manejo de preflight CORS (OPTIONS)
		if (request.method === "OPTIONS") {
			const headers = new Headers();
			if (isAllowedOrigin(origin)) {
				headers.set("Access-Control-Allow-Origin", origin);
				headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
				headers.set("Access-Control-Allow-Headers", "Content-Type");
				headers.set("Access-Control-Max-Age", "86400");
			}
			return new Response(null, { status: 204, headers });
		}

		// ✅ Ruta vacía
		if (!path || path === "/") {
			return new Response("Not Found", { status: 404 });
		}

		const key = `ubicate-tiles${path}`;
		console.log("Fetching tile with key:", key);

		const obj = await env.R2.get(key);
		if (!obj) {
			return new Response("Tile not found", { status: 404 });
		}

		const compressedData = await obj.arrayBuffer();

		const ds = new DecompressionStream("gzip");
		const decompressedStream = new Response(
			new Response(compressedData).body!.pipeThrough(ds)
		);
		const decompressedData = await decompressedStream.arrayBuffer();

		const headers = new Headers({
			"Content-Type": "application/x-protobuf",
			"Cache-Control": "public, max-age=3600",
		});

		if (isAllowedOrigin(origin)) {
			headers.set("Access-Control-Allow-Origin", origin ?? "");
		}

		return new Response(decompressedData, {
			status: 200,
			headers,
		});
	},
} satisfies ExportedHandler<Env>;
