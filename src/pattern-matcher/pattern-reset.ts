import { isEqual } from "lodash";
import {
  MatchedList,
  MatchOptions,
  GroupResult,
  defaultOptions
} from "./matched-list";
import { patternPreprocess } from "./pattern-preprocess";

interface IObject {
  [key: string]: any;
  [key: number]: any;
}

const patternResetArray = <T extends IObject>(
  tmpl: T[],
  matched: MatchedList,
  opts: Partial<MatchOptions> = defaultOptions
): T[] => {
  if (opts.debug) console.log(`patternResetArray(`, tmpl, `,`, matched, `)`);
  let obj: T[] = [];
  const isGroup = opts.isGroup || defaultOptions.isGroup;
  for (let i = 0; i < tmpl.length; i++) {
    const tmplElement = tmpl[i];

    if (opts.debug) console.log(`tmplElement:`, tmplElement);
    const key = isGroup(tmplElement);
    if (key) {
      if (opts.debug) console.log(`key found`, key);
      switch (key.type) {
        case "MULTIPLE":
        case "ANY":
          obj = [...obj, ...matched[key.as]];
          continue;
      }
      obj.push(matched[key.as]);
    } else {
      obj.push(patternReset(tmplElement, matched, opts));
    }
  }

  if (opts.debug) console.log(`obj:`, obj);
  return obj;
};

const patternResetObject = <T extends IObject>(
  tmpl: T,
  matched: MatchedList,
  opts: Partial<MatchOptions> = defaultOptions
): IObject => {
  if (opts.debug) console.log(`patternResetObject(`, tmpl, `,`, matched, `)`);
  const tmplKeys = Object.keys(tmpl).sort();
  const obj: IObject = {};

  for (const tmplKey of tmplKeys) {
    obj[tmplKey] = patternReset(tmpl[tmplKey], matched, opts);
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
  tmplRaw: any,
  matched: MatchedList,
  opts: Partial<MatchOptions> = defaultOptions
): any => {
  const tmpl = patternPreprocess(tmplRaw, opts);
  const isNode = opts.isNode || defaultOptions.isNode;
  const isGroup = opts.isGroup || defaultOptions.isGroup;
  const isDisorderly = opts.isDisorderly || defaultOptions.isDisorderly;
  if (opts.debug) console.log(`patternReset(`, tmpl, `,`, matched, `)`);

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
    if (opts.debug) console.log("type:array");
    return patternResetArray(tmpl, matched, opts);
  }

  if (typeof tmplU === "object" && tmplU !== null) {
    if (opts.debug) console.log("type:object");
    return patternResetObject(tmplU, matched, opts);
  }

  return tmpl;
};
