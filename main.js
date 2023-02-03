const app = require("express")();
const bodyParser = require('body-parser');
const { Helper } = require("./helper");
const { parse } = require("url");
const { readFileSync, existsSync } = require("fs");
const sites = require("./sites.json");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

async function handler(req, res) {
  let site = sites[req.hostname];

  if(typeof site === "number") {
    let options = {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"]
      }
    };

    if(req.body && !["GET", "HEAD"].includes(req.method)) {
      if(req.headers["content-type"] === "application/x-www-form-urlencoded") {
        let formBody = [];
        for (var prop in req.body) {
          let encodedKey = encodeURIComponent(prop);
          let encodedValue = encodeURIComponent(req.body[prop]);
          formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");
      
        options.body = formBody;
      } else {
        options.body = JSON.stringify(req.body);
      }
    }
  
    let response = await fetch(
      `http://localhost:${sites[req.hostname]}${req.originalUrl}`
    , options);
    
    res.writeHead(
      200, 
      {"Content-Type": response.headers.get("Content-Type")}
    ).end(Buffer.from(await response.arrayBuffer()));
  } else if(typeof site === "string") {
    let path = req.path;
    if([...new Set(path.split(""))].join("") === "/")
      path = "/index.html";
  
    let mime = Helper.getMime(path);
    let file = site + path;
    
    if (existsSync(file)) {
      res.writeHead(200,
        {"Content-Type": mime}
      ).end(readFileSync(file));
    } else {
      res.status(404).end("404");
    }
  } else {
    res.status(404).end("404");
  }
}

app.all("*", handler);

app.listen(80);
