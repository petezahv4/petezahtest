import { createBareServer } from "@tomphttp/bare-server-node";
import express from "express";
import { createServer } from "node:http";
import { join } from "node:path";
import { hostname } from "node:os";
import { fileURLToPath } from "url";  // Import fileURLToPath from 'url'
import { dirname } from "path";  // Import dirname from 'path'

// Deriving __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);  // Get file path from import.meta.url
const __dirname = dirname(__filename);  // Get the directory name

const bare = createBareServer("/bare/");
const app = express();

// Set the public path to the 'public' directory
const publicPath = join(__dirname, "public");

// Load static files from the 'public' directory first and prioritize them
app.use(express.static(publicPath));
// Load vendor files last (adjust path if necessary).
app.use("/petezah/", express.static(publicPath)); // Adjust if necessary

// Error for everything else
app.use((req, res) => {
  res.status(404);
  res.sendFile(join(publicPath, "404.html"));
});

const server = createServer();

server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 80;

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

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close();
  bare.close();
  process.exit(0);
}

server.listen({
  port,
});
