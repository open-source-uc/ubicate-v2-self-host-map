export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const origin = request.headers.get("Origin");

		function isAllowedOrigin(origin: string | null): boolean {
			if (!origin) return false;

			// Localhost para desarrollo
			if (
				origin === "http://localhost:3000" ||
				origin === "http://127.0.0.1:3000" ||
				origin === "http://localhost:8080" ||
				origin === "http://127.0.0.1:8080"
			) return true;

			// Dominios permitidos - incluye guión bajo (_)
			const osucDevRegex = /^https:\/\/([a-z0-9_-]+\.)*osuc\.dev$/;
			const pagesDevRegex = /^https:\/\/([a-z0-9_-]+\.)*pages\.dev$/;
			return osucDevRegex.test(origin) || pagesDevRegex.test(origin);
		}

		// Headers CORS comunes
		const corsHeaders = {
			"Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
			"Access-Control-Max-Age": "86400",
		};

		// Manejo de preflight CORS (OPTIONS)
		if (request.method === "OPTIONS") {
			const headers = new Headers(corsHeaders);

			if (isAllowedOrigin(origin)) {
				headers.set("Access-Control-Allow-Origin", origin ?? "");
			}

			return new Response(null, {
				status: 204,
				headers
			});
		}

		// Ruta vacía
		if (!path || path === "/") {
			const headers = new Headers();
			if (isAllowedOrigin(origin)) {
				headers.set("Access-Control-Allow-Origin", origin ?? "");
			}
			return new Response("Not Found", { status: 404, headers });
		}

		try {
			const key = `ubicate-tiles${path}`;
			console.log("Fetching tile with key:", key);

			const obj = await env.R2.get(key);
			if (!obj) {
				const headers = new Headers();
				if (isAllowedOrigin(origin)) {
					headers.set("Access-Control-Allow-Origin", origin ?? "");
				}
				return new Response("Tile not found", { status: 404, headers });
			}

			const compressedData = await obj.arrayBuffer();

			// Descomprimir gzip
			const ds = new DecompressionStream("gzip");
			const decompressedStream = new Response(
				new Response(compressedData).body!.pipeThrough(ds)
			);
			const decompressedData = await decompressedStream.arrayBuffer();

			// Headers de respuesta
			const headers = new Headers({
				"Content-Type": "application/x-protobuf",
				"Cache-Control": "public, max-age=3600",
			});

			// Añadir CORS headers
			if (isAllowedOrigin(origin)) {
				headers.set("Access-Control-Allow-Origin", origin ?? "");
				headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
				headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
			}

			return new Response(decompressedData, {
				status: 200,
				headers,
			});

		} catch (error) {
			console.error("Error processing request:", error);

			const headers = new Headers();
			if (isAllowedOrigin(origin)) {
				headers.set("Access-Control-Allow-Origin", origin ?? "");
			}

			return new Response("Internal Server Error", {
				status: 500,
				headers
			});
		}
	},
} satisfies ExportedHandler<Env>;