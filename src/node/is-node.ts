import * as t from "@babel/types";

export const isNode = (o: any): o is t.Node => {
  return !!o && !!o.type && typeof o.type === "string";
};
