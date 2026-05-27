import http from "node:http";
import { registry } from "./registry.js";

/**
 * Starts a plain Node.js HTTP server on `port` that serves Prometheus metrics
 * at `GET /metrics`. Runs on a separate port from the main API so scrape
 * traffic never competes with GraphQL requests.
 */
export function startMetricsServer(port: number): void {
  const server = http.createServer(async (_req, res) => {
    if (_req.method === "GET" && _req.url === "/metrics") {
      const metrics = await registry.metrics();
      res.setHeader("Content-Type", registry.contentType);
      res.end(metrics);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    console.log(`Metrics server running at http://localhost:${port}/metrics`);
  });
}
