import { DirNodeRule, dir, mount } from "espolice";
import { Index, Other } from "./templates";

const RootDir: DirNodeRule = dir()
  .haveChildFile(Index, "index.js")
  .otherChildrenFiles(Other);

mount(RootDir, "./routes");
