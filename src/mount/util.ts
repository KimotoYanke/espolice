import { fs } from "mz";
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
