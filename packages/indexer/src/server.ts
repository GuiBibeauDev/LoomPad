import { createServer } from "node:http";

const port = Number.parseInt(process.env["INDEXER_PORT"] ?? "8787", 10);
if (!Number.isInteger(port) || port < 1 || port > 65_535)
  throw new Error("INDEXER_PORT must be a valid port");

const server = createServer((request, response) => {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200).end(JSON.stringify({ status: "ok", trust: "read-only" }));
    return;
  }
  if (request.method === "GET" && request.url === "/v1/launches") {
    response
      .writeHead(200)
      .end(JSON.stringify({ data: [], source: "indexer", execution: "use-solana-rpc" }));
    return;
  }
  response.writeHead(404).end(JSON.stringify({ error: "not_found" }));
});

server.requestTimeout = 10_000;
server.headersTimeout = 12_000;
server.listen(port, "127.0.0.1", () =>
  process.stdout.write(`LoomPad indexer listening on http://127.0.0.1:${port}\n`)
);
