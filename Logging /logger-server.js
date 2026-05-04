const http = require("http");
const fs = require("fs");

const server = http.createServer((req, res) => {

    if (req.method === "POST" && req.url === "/log") {

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            try {
                // 🔥 safer parse
                const data = JSON.parse(body || "{}");
                const log = data.message || "EMPTY LOG";

                console.log("📥 LOG:", log);

                fs.appendFile("remote.log", log + "\n", err => {
                    if (err) console.error("WRITE ERROR:", err);
                });

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true }));

            } catch (err) {
                console.error("PARSE ERROR:", err);

                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid JSON" }));
            }
        });

    } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
    }
});

server.listen(4000, "0.0.0.0", () => {
    console.log("📡 Logging server running on port 4000");
});
