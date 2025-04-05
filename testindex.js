import { createBareServer } from "@tomphttp/bare-server-node";
import express from "express";
import { createServer } from "node:http";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { join } from "node:path";
import { hostname } from "node:os";

// Initialize Bare server and Express
const bare = createBareServer("/bare/");
const app = express();
const publicPath = "public";

// Serve static files (prioritize the publicPath over vendor files)
app.use(express.static(publicPath));
// Serve vendor files (configured to load after public files)
app.use("/static/", express.static(uvPath));

// Express error handler for 404
app.use((req, res) => {
  res.status(404);
  res.sendFile(join(publicPath, "404.html"));
});

// Create the HTTP server
const server = createServer();

// Handle HTTP requests
server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) {
    // If the Bare server can handle the request, route it through Bare
    bare.routeRequest(req, res);
  } else {
    // Otherwise, pass it to Express
    app(req, res);
  }
});

// Handle WebSocket upgrades (if applicable)
server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    // Route WebSocket requests via Bare if necessary
    bare.routeUpgrade(req, socket, head);
  } else {
    // Otherwise, end the socket connection
    socket.end();
  }
});

// Define the server's port (use environment variable or default to 3000)
let port = parseInt(process.env.PORT || "3000");

if (isNaN(port)) port = 3000;

// Log server listening details once started
server.on("listening", () => {
  const address = server.address();
  console.log("Listening on:");
  console.log(`\thttp://localhost:${address.port}`);
  console.log(`\thttp://${hostname()}:${address.port}`);
  console.log(
    `\thttp://${
      address.family === "IPv6" ? `[${address.address}]` : address.address
    }:${address.port}`
  );
});

// Graceful shutdown handling
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close();
  bare.close();
  process.exit(0);
}

// Start the server
server.listen({
  port,
});
