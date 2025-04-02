app.use(express.static(pubDir));

app.get("/uv/config.js", (req, res) => {
        res.sendFile(path.join(pubDir, "uv/config.js"));
});

app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/libcurl/", express.static(libcurlPath));
app.use("/baremux/", express.static(baremuxPath));

app.use((req, res) => {
        res.status(404).sendFile(path.join(pubDir, "404.html"));
});

server.on("upgrade", (req, socket, head) => {
        if (req.url.endsWith("/wisp/")) {
                wisp.routeRequest(req, socket, head);
        } else {
                socket.end();
        }
});

server.listen(port, "0.0.0.0", () => {
        const address = server.address();
        console.log(startup_msg)
});

