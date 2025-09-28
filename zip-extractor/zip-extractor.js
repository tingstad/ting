#!/usr/bin/env node
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

http.createServer((req, res) => {
  const url = req.url;
  console.log('> ' + url);
  if (!url.startsWith("/proxy/")) {
    let filePath = path.join(__dirname, url == "/" || url.startsWith("/?")
      ? "zip-extractor.html" : url.split('?')[0]);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
    return;
  }
  let target;
  try {
    target = new URL(decodeURIComponent(url.substring("/proxy/".length)));
  } catch (error) {
    return res.writeHead(400).end("Invalid url");
  }

  const client = target.protocol == "https:" ? https : http;
  const reqHeaders = { ...req.headers, host: target.host };
  const options = { method: req.method, headers: reqHeaders, timeout: 5_000 };
  const remoteReq = client.request(target, options, (remoteRes) => {
    console.log('< ', remoteRes.statusCode);
    const headers = {
      ...remoteRes.headers,
      "access-control-allow-origin": "*",
    };
    res.writeHead(remoteRes.statusCode, headers);
    remoteRes.pipe(res);
  }).on("error", (err) => { console.log(err); res.end(err.toString()); });
  req.pipe(remoteReq);
}).listen(8080, () => console.log("Running on http://localhost:8080"));

