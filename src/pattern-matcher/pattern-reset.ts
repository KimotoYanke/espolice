import { isEqual } from "lodash";
import {
  MatchedList,
  MatchOptions,
  GroupResult,
  defaultOptions
} from "./matched-list";
import { Options } from "istanbul-reports";

interface IObject {
  [key: string]: any;
  [key: number]: any;
}

const patternResetArray = <T extends IObject>(
  tmpl: T[],
  matched: MatchedList,
  opts: Partial<MatchOptions> = defaultOptions
): T[] | false => {
  if (opts.debug) console.log(`patternMatchArray(`, tmpl, `,`, matched, `)`);
  const obj: T[] = [];
  const isGroup = opts.isGroup || defaultOptions.isGroup;
  for (let i = 0; i < tmpl.length; i++) {
    const tmplElement = tmpl[i];
    const key = isGroup(tmplElement);
    if (key) {
      switch (key.type) {
        case "MULTIPLE":
        case "ANY":
          obj.concat(matched[key.as]);
          continue;
      }
      obj.push(matched[key.as]);
    }
    obj.push(tmplElement);
  }
  return obj;
};

/**
 * パターンからリセットを行う
 * @param tmpl      テンプレートのオブジェクト
 * @param matched   対象のMatchedList
 * @param opts  オプション
 * @returns 結果
 */
export const patternReset = (
  tmpl: any,
  matched: MatchedList,
  opts: Partial<MatchOptions> = defaultOptions
): any => {
  const isNode = opts.isNode || defaultOptions.isNode;
  const isGroup = opts.isGroup || defaultOptions.isGroup;
  const isDisorderly = opts.isDisorderly || defaultOptions.isDisorderly;
  if (opts.debug) console.log(`patternMatch(`, tmpl, `,`, matched, `)`);

  const tmplU = tmpl as unknown;

  if (isNode(tmplU) && isGroup(tmplU)) {
    const key: false | GroupResult = isGroup(tmplU);

    if (key) {
      if (opts.debug) console.log(`grouped:`, matched[key.as], `as`, key.as);

      switch (key.type) {
        case "SINGLE":
        case "ANY":
          return matched[key.as];
        default:
          return undefined;
      }
    }
  }

  if (tmpl instanceof Array) {
    if (opts.debug) console.log("array");
    return patternResetArray(tmpl, matched, opts);
  }

  /*if (typeof tmplU === "object" && tmplU !== null) {
    if (opts.debug) console.log("type:object");
    return patternResetObject(tmplU, matched, opts);
  }*/

  return tmpl;
};
