import * as t from "@babel/types";
import { ObjectIsFunction } from "./pattern-matcher";

export const isNode = (o: any): o is t.Node => {
  return !!o && !!o.type && typeof o.type === "string";
};
