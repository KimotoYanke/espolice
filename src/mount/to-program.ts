import * as t from "@babel/types";

export const toProgram = (tmplAst: object): t.Program => {
  let tmpl: t.Program = t.program([]);
  if (t.isProgram(tmplAst)) {
    tmpl = tmplAst;
  } else if (t.isExpression(tmplAst)) {
    tmpl = t.program([t.expressionStatement(tmplAst)]);
  } else if (t.isStatement(tmplAst)) {
    tmpl = t.program([tmplAst]);
  } else if (tmplAst instanceof Array) {
    tmpl = t.program(
      tmplAst.map(ex => (t.isExpression(ex) ? t.expressionStatement(ex) : ex))
    );
  }
  return tmpl;
};
