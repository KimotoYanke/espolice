import { isEqual, memoize } from "lodash";
import * as t from "@babel/types";
import { isGroup } from "./is-group";
const sortObject = (o: IObject) => {
  const keys = Object.keys(o);
  keys.sort();
  return keys.map(k => o[k]);
};

interface IObject {
  [key: string]: any;
  [key: number]: any;
}

type MatchedList = {
  [key: string]: any;
  [key: number]: any;
};

export type ObjectIsFunction = (obj: any) => boolean;
export type IsGroupFunction = (obj: any) => string | false;
const defaultIsAtomicFunction: ObjectIsFunction = () => true;
const defaultIsGroupFunction: IsGroupFunction = () => false;

interface Options {
  isNode: ObjectIsFunction;
  isGroup: IsGroupFunction;
  debug: boolean;
}
const defaultOptions: Options = {
  isNode: defaultIsAtomicFunction,
  isGroup: defaultIsGroupFunction,
  debug: false
};

const patternMatchArray = <T extends IObject, O extends IObject>(
  tmpl: T[],
  obj: O[],
  opts: Partial<Options> = defaultOptions
): MatchedList | false => {
  if (opts.debug) console.log(`patternMatchArray(`, tmpl, `,`, obj, `)`);
  let i = 0,
    j = 0;
  const isGroup = opts.isGroup || defaultOptions.isGroup;
  let groups: { [key: string]: any } = {};
  while (i < tmpl.length || j < obj.length) {
    const tmplElement = tmpl[i];
    const objElement = obj[j];

    const result = patternMatch(tmplElement, objElement, opts);
    const key = isGroup(tmplElement);

    if (key) {
      const happyEnd: T[] = tmpl.slice(i + 1);
      if (opts.debug) console.log("happyEnd", happyEnd);
      if (happyEnd.length === 0) {
        groups[key] = obj.slice(j);
        continue;
      } else {
        groups[key] = [];
      }

      // tmplが[0,*,2,3]で現在"*"の時、[2,3]をhappyEndとし、[0,4,5,6,2,3]からtailして行って[2,3]と一致するまで待つ
      let matched: MatchedList | false;

      while ((matched = patternMatch(happyEnd, obj.slice(j), opts)) === false) {
        if (opts.debug) console.log("obj.slice(j):", obj.slice(j));
        if (opts.debug) console.log("matched:", matched, happyEnd);

        groups[key].push(obj[j]);
        j++;
        if (obj.slice(j).length === 0) {
          if (opts.debug) console.log("tail(obj).length == 0");

          return false;
        }
      }
      j--;
      if (opts.debug)
        console.log("matched:", i, tmpl[i], j, obj[j], matched, groups[key]);
    } else if (result === false) {
      return false;
    }
    // ここにpatternMatchからのデータがある場合の処理を書く
    if (opts.debug) console.log({ groups });

    i++;
    j++;
  }
  return groups;
};

const patternMatchObject = <T extends IObject, O extends IObject>(
  tmpl: T,
  obj: O,
  opts: Partial<Options> = defaultOptions
): MatchedList | false => {
  const tmplKeys = Object.keys(tmpl);
  const objKeys = Object.keys(obj);

  let groups: MatchedList = {};

  if (tmplKeys.length !== objKeys.length) {
    if (opts.debug)
      console.log(
        "length don't match:",
        tmplKeys.length,
        "(tmpl)",
        "=/=",
        objKeys.length,
        "(obj)"
      );
    return false;
  }

  let i = 0;

  tmplKeys.sort();
  objKeys.sort();

  for (const tmplKey of tmplKeys) {
    i++;
    if (!objKeys.includes(tmplKey)) {
      if (opts.debug) console.log("keys of obj don't includes:", tmplKey);
      if (opts.debug) console.log(objKeys);
      return false;
    }

    if (tmplKeys.length < i || objKeys.length < i) {
      if (opts.debug)
        console.log("over length", { i, tmplKeysLength: tmplKeys.length });
      return false;
    }

    const matched = patternMatch(tmpl[tmplKey], obj[tmplKey], opts);

    if (matched === false) {
      return false;
    }

    groups = { ...groups, ...matched };
  }

  return groups;
};

/**
 * パターンマッチを行う
 * @param tmpl  テンプレートのオブジェクト
 * @param obj   対象のオブジェクト
 * @param opts  オプション
 * @returns マッチに失敗した時、falseを返す
 */
export const patternMatch = <T, O>(
  tmpl: T,
  obj: O,
  opts: Partial<Options> = defaultOptions
): MatchedList | false => {
  const isNode = opts.isNode || defaultOptions.isNode;
  const isGroup = opts.isGroup || defaultOptions.isGroup;
  if (opts.debug) console.log(`patternMatch(`, tmpl, `,`, obj, `)`);

  if (typeof tmpl !== typeof obj) {
    return false;
  }

  const tmplU = tmpl as unknown;
  const objU = obj as unknown;

  if (isNode(tmplU) && isNode(objU) && isGroup(tmplU)) {
    const key = isGroup(tmplU);

    if (key) {
      if (opts.debug) console.log(`grouped:`, objU, `as`, key);
      return { [key]: objU };
    }
  }

  if (tmpl instanceof Array && obj instanceof Array) {
    if (opts.debug) console.log("array");
    return patternMatchArray(tmpl, obj, opts);
  }

  if (
    typeof tmplU === "object" &&
    typeof objU === "object" &&
    tmplU !== null &&
    objU !== null
  ) {
    if (opts.debug) console.log("type:object");
    return patternMatchObject(tmpl, obj, opts);
  }

  if (opts.debug) console.log("type:isEqual", "returns", isEqual(tmpl, obj));
  return isEqual(tmpl, obj) ? {} : false;
};
