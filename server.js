const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT || 4174);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8" };

http.createServer((request, response) => {
  const pathname = request.url.split("?")[0];
  const file = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = path.resolve(root, file);
  if (!target.startsWith(root) || !fs.existsSync(target)) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": types[path.extname(target)] || "text/plain; charset=utf-8" });
  fs.createReadStream(target).pipe(response);
}).listen(port, () => console.log(`Operation Platform prototype: http://localhost:${port}`));
