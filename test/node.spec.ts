import { isGroup } from "../src/node/is-group";
import template from "@babel/template";
describe("ノード", () => {
  test("isGroup関数", () => {
    const tmplAstT1 = template.statement`"defaultFunc = @any"`();
    const tmplAstT2 = template.statement`"defaultFunc=@any"`();

    expect(isGroup(tmplAstT1, 0)[0]).not.toBeFalsy();
    expect(isGroup(tmplAstT2, 0)[0]).not.toBeFalsy();

    const tmplAstF = template.statement`"defaultFunc = any"`();

    expect(isGroup(tmplAstF, 0)[0]).toBeFalsy();
  });
  test("isUnquote関数", () => {
    const tmplAstL = template.statement`
    // @unquote
    tmpl
    `;
  });
});
