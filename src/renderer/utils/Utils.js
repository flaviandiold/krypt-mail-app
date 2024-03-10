import { readFile } from "../lib/fileAction";
const path = require("path");
export async function ParseContent(folder) {
  console.log("in parse content", path.join(folder));
  return JSON.parse(readFile(path.join(folder)))
    ? JSON.parse(readFile(path.join(folder)))
    : null;
}
