const fs = require("fs");
const path = require("path");
const pagesDir = "C:/Uni/8. Semester/Smart Applications/App/frontend/src/pages";
for (const fname of fs.readdirSync(pagesDir).filter(f => f.endsWith(".tsx"))) {
  const fpath = path.join(pagesDir, fname);
  let buf = fs.readFileSync(fpath);
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    buf = buf.slice(3);
  }
  let content = buf.toString("utf-8");
  const original = content;
  content = content.replace(/\u00c3\u201e/g, "\u00c4");
  content = content.replace(/\u00c3\u00a4/g, "\u00e4");
  content = content.replace(/\u00c3\u2013/g, "\u00d6");
  content = content.replace(/\u00c3\u00b6/g, "\u00f6");
  content = content.replace(/\u00c3\u0153/g, "\u00dc");
  content = content.replace(/\u00c3\u00bc/g, "\u00fc");
  content = content.replace(/\u00c5\u2018/g, "\u00df");
  if (content !== original) {
    fs.writeFileSync(fpath, content, "utf-8");
    console.log(fname + ": mojibake fixed");
  }
}
console.log("Done");
