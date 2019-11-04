import { isGroup } from "../../src/node/is-group";
import template from "@babel/template";
import * as t from "@babel/types";
import { patternMatchAST } from "../../src/pattern-matcher";
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
  test("全@any", () => {
    const tmplAst = template.program`
      "@any"
    `();

    const objAst = template.program`
    import { isGroup } from "../../src/node/is-group";
    import template from "@babel/template";
    describe("ノード", () => { });
    `();
    expect(patternMatchAST(tmplAst, objAst)).toBeTruthy();
  });
  test("todo-test", () => {
    const tmplAst = {
      type: "Program",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "AssignmentExpression",
            operator: "=",
            left: {
              type: "MemberExpression",
              object: { type: "Identifier", name: "module" },
              property: { type: "Identifier", name: "exports" },
              computed: false
            },
            right: {
              type: "ArrowFunctionExpression",
              id: null,
              generator: false,
              async: false,
              params: [
                { type: "Identifier", name: "sequelize" },
                { type: "Identifier", name: "DataTypes" }
              ],
              body: {
                type: "BlockStatement",
                body: [
                  {
                    type: "VariableDeclaration",
                    declarations: [
                      {
                        type: "VariableDeclarator",
                        id: { type: "Identifier", name: "table" },
                        init: {
                          type: "CallExpression",
                          callee: {
                            type: "MemberExpression",
                            object: { type: "Identifier", name: "sequelize" },
                            property: { type: "Identifier", name: "define" },
                            computed: false
                          },
                          arguments: [
                            { type: "StringLiteral", value: "user" },
                            { type: "StringLiteral", value: "one_0 = @one" },
                            { type: "StringLiteral", value: "one_1 = @one" }
                          ]
                        }
                      }
                    ],
                    kind: "const"
                  },
                  {
                    type: "ExpressionStatement",
                    expression: {
                      type: "AssignmentExpression",
                      operator: "=",
                      left: {
                        type: "MemberExpression",
                        object: { type: "Identifier", name: "table" },
                        property: { type: "Identifier", name: "associate" },
                        computed: false
                      },
                      right: {
                        type: "FunctionExpression",
                        id: null,
                        generator: false,
                        async: false,
                        params: [{ type: "Identifier", name: "models" }],
                        body: {
                          type: "BlockStatement",
                          body: [],
                          directives: []
                        }
                      }
                    }
                  },
                  {
                    type: "ReturnStatement",
                    argument: { type: "Identifier", name: "table" }
                  }
                ],
                directives: []
              }
            }
          }
        }
      ],
      directives: [],
      interpreter: null
    };

    const objAst = {
      type: "Program",
      interpreter: null,
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "AssignmentExpression",
            operator: "=",
            left: {
              type: "MemberExpression",
              object: { type: "Identifier", name: "module" },
              property: { type: "Identifier", name: "exports" },
              computed: false
            },
            right: {
              type: "ArrowFunctionExpression",
              id: null,
              generator: false,
              async: false,
              params: [
                { type: "Identifier", name: "sequelize" },
                { type: "Identifier", name: "DataTypes" }
              ],
              body: {
                type: "BlockStatement",
                body: [
                  {
                    type: "VariableDeclaration",
                    declarations: [
                      {
                        type: "VariableDeclarator",
                        id: { type: "Identifier", name: "table" },
                        init: {
                          type: "CallExpression",
                          callee: {
                            type: "MemberExpression",
                            object: { type: "Identifier", name: "sequelize" },
                            property: { type: "Identifier", name: "define" },
                            computed: false
                          },
                          arguments: [
                            { type: "StringLiteral", value: "user" },
                            t.objectExpression([]),
                            t.objectExpression([])
                          ]
                        }
                      }
                    ],
                    kind: "const"
                  },
                  {
                    type: "ExpressionStatement",
                    expression: {
                      type: "AssignmentExpression",
                      operator: "=",
                      left: {
                        type: "MemberExpression",
                        object: { type: "Identifier", name: "table" },
                        property: { type: "Identifier", name: "associate" },
                        computed: false
                      },
                      right: {
                        type: "FunctionExpression",
                        id: null,
                        generator: false,
                        async: false,
                        params: [{ type: "Identifier", name: "models" }],
                        body: {
                          type: "BlockStatement",
                          body: [],
                          directives: []
                        }
                      }
                    }
                  },
                  {
                    type: "ReturnStatement",
                    argument: { type: "Identifier", name: "table" }
                  }
                ],
                directives: []
              }
            }
          }
        }
      ],
      directives: []
    };

    expect(
      patternMatchAST(tmplAst as t.Program, objAst as t.Program)
    ).toStrictEqual({
      one_0: t.objectExpression([]),
      one_1: t.objectExpression([])
    });
  });
});
