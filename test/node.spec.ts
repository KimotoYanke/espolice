import { isGroup } from "../src/node/is-group";
import template from "@babel/template";
describe("ノード", () => {
  test("isGroup関数", () => {
    const tmplAstT1 = template.statement`"defaultFunc = @any"`();
    const tmplAstT2 = template.statement`"defaultFunc=@any"`();

    expect(isGroup(tmplAstT1)).not.toBeFalsy();
    expect(isGroup(tmplAstT2)).not.toBeFalsy();

    const tmplAstF = template.statement`"defaultFunc = any"`();

    expect(isGroup(tmplAstF)).toBeFalsy();
  });
  test("isUnquote関数", () => {
    const tmplAstL = template.statement`
    // @unquote
    tmpl
    `;
  });
});
