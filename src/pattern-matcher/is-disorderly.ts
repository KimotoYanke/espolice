import * as t from "@babel/types";
export const isDisorderly = (ast: any) =>
  t.isObjectExpression(ast) && "properties";
