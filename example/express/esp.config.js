import { dir, mount } from "espolice";
import { Index } from "./templates/index";
import { Other } from "./templates/other";
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
