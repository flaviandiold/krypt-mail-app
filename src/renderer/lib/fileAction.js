const homedir = require("os").homedir();
var fs = require("fs");
const path = require("path");
let appPath = "KryptMail";

export function readFile(filePath) {
  let newpath = path.join(homedir, appPath, filePath);
  // console.log(newpath);
  let z;
  try {
    z = fs.readFileSync(newpath, { encoding: "utf8" });
  } catch (error) {
    z = false;
  }
  // console.log(z)
  // console.log("reads", filePath, z);
  return z;
}

export const createFolder = (newpath) => {
  try {
    fs.mkdirSync(path.join(homedir, appPath, newpath));
  } catch (error) {}
};

export const WriteFile = async (filePath, data) => {
  try {
    console.log("writes", filePath, data);
    // if (!fs.existsSync(filePath)) {
    //   console.log("not exists creating");
    //   createFolder(filePath);
    // }
    if (data) {
      fs.writeFileSync(
        path.join(homedir, appPath, filePath),
        JSON.stringify(data, Set_toJSON),
        {
          encoding: "utf8",
          flag: "w",
        }
      );
    }
    function Set_toJSON(key, value) {
      if (typeof value === "object" && value instanceof Set) {
        return [...value];
      }
      return value;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};
export const checkExists = (filepath) => {
  let z;
  try {
    z = fs.existsSync(path.join(homedir, appPath, filepath));
    return z;
  } catch (error) {
    return false;
  }
};

export const DeleteFile = (filepath) => {
  let delpath = path.join(homedir, appPath, filepath);
  try {
    let x = fs.rmSync(delpath, {
      recursive: true,
      force: true,
    });
    return true;
  } catch (error) {
    console.log(error);
  }
};
