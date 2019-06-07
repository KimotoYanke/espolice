import * as chokidar from "chokidar";
import { DirNodeRule } from "../rule/dir";
import * as path from "path";
import * as t from "@babel/types";
import * as fs from "fs";
import { NodeRule } from "../rule";
import { State } from "../state";
import generate from "@babel/generator";

type PseudoNode = PseudoDirectory | PseudoFile;

type PseudoDirectory = {
  type: "dir";
  name: string;
  children: (PseudoNode)[];
};

type PseudoFile = {
  type: "name";
  name: string;
  ast?: t.File;
};

const readdirAsPseudoDirectory = (p: string, opts?: { ignore: string[] }) => {
  return fs
    .readdirSync(p)
    .map(
      (childName: string): PseudoNode => {
        const pathFromRoot = path.join(p, childName);
        if (opts.ignore.includes(pathFromRoot)) {
          return;
        }
        if (fs.statSync(pathFromRoot).isDirectory()) {
          const result: PseudoDirectory = {
            type: "dir",
            name: childName,
            children: readdirAsPseudoDirectory(pathFromRoot, opts)
          };
          return result;
        }

        const result: PseudoFile = {
          type: "name",
          name: childName
        };
        return result;
      }
    )
    .filter(v => !!v);
};

const findNode = (splittedPath: string[], node: DirNodeRule) => {
  const nodes = splittedPath.reduce<NodeRule>(
    (prev, current: string, currentIndex, array) => {
      if (prev === null) {
        return null;
      }

      if (typeof prev === "function") {
        return null;
      }

      if (currentIndex === array.length - 1) {
        return (
          prev.childFileNodes[current] ||
          prev.otherFileNode ||
          prev.childDirNodes[current] ||
          prev.otherDirNode ||
          null
        );
      }

      return prev.childDirNodes[current] || prev.otherDirNode || null;
    },
    node
  );
  return nodes;
};

export const mount = (rootPath: string, rootNode: DirNodeRule) => {
  const watcher = chokidar.watch(rootPath, {
    persistent: true
  });
  const root: PseudoNode[] = readdirAsPseudoDirectory(rootPath, {
    ignore: ["node_modules", ".git"]
  });
  watcher.on("all", (event, p, stats) => {
    const pathFromRoot = path.relative(rootPath, p);
    const splittedPath = path.join(pathFromRoot).split("/");
    const parentPath = splittedPath.slice(0, -1) || null;
    const node = findNode(splittedPath, rootNode);
    if (event === "add") {
      console.log("add", splittedPath);
      console.log("parent", splittedPath.slice(0, -1) || null);
      const parent: DirNodeRule<{}> = findNode(
        parentPath,
        rootNode
      ) as DirNodeRule;

      if (typeof node === "function") {
        const state: State<{}, any> = {};
        console.log(generate(node(state)));
      }
    }
  });
};
