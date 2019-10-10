import * as fs from "fs";
export const isDirectoryExistSync = (p: string): boolean => {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
};

export const mkdirpSync = (p: string) => {
  if (!isDirectoryExistSync(p)) {
    fs.mkdirSync(p);
  }
};

export const isFileExistSync = (p: string): boolean => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};

export const lsDirectorySync = (p: string): string[] | null => {
  if (isDirectoryExistSync(p)) {
    return fs.readdirSync(p);
  }
  return null;
};

export const rmpFileSync = (p: string) => {
  if (isFileExistSync(p)) {
    fs.unlinkSync(p);
  }
};

export const rmpDirSync = (p: string) => {
  if (isDirectoryExistSync(p)) {
    fs.rmdirSync(p);
  }
};
