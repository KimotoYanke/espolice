import { DirNodeRule, dir, mount } from "espolice";
import { Index } from "./templates";

const RootDir: DirNodeRule = dir().haveChildFile(Index, "index.js");

mount({}, RootDir, "./routes");
