import { dir, mount } from "espolice";
import { Index, Other } from "./templates/index";
const OtherDir = dir()
  .haveChildFile(Index, "index.js")
  .otherChildrenFiles(Other);
OtherDir.otherChildrenDirs(OtherDir);
const RootDir = dir()
  .haveChildFile(Index, "index.js")
  .otherChildrenFiles(Other)
  .otherChildrenDirs(OtherDir);

mount(RootDir, "./routes", {
  usePrettier: true
});
