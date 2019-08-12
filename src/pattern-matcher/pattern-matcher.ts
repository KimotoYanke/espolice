import { isEqual } from "lodash";

interface IObject {
  [key: string]: any;
  [key: number]: any;
}

type MatchedList = {
  [key: string]: any;
  [key: number]: any;
};

const matchedListMerge = (
  base: MatchedList,
  appended: MatchedList,
  genericList: string[]
) => {
  const result = { ...base };
  for (let matchedKey in appended) {
    let actualMatchedKey = matchedKey;
    let i = 0;
    const groups = matchedKey.match(/^(.+)_(\d+)$/);
    if (groups) {
      actualMatchedKey = groups[1];
      i = parseInt(groups[2]);
    }
    if (genericList.includes(actualMatchedKey)) {
      let matchedKeyWithCount: string;
      do {
        matchedKeyWithCount = actualMatchedKey + "_" + i;
        i++;
      } while (result[matchedKeyWithCount]);
      result[matchedKeyWithCount] = appended[matchedKey];
      continue;
    }
    result[matchedKey] = appended[matchedKey];
  }
  return result;
};

export type ObjectIsFunction = (obj: any) => boolean;
export type GroupResult = { type: "MULTIPLE" | "SINGLE" | "ANY"; as: string };
export type IsGroupFunction = (obj: any) => GroupResult | false;
export type ObjectIsDisorderlyFunction = (obj: object) => false | string;
const defaultIsAtomicFunction: ObjectIsFunction = () => true;
const defaultIsGroupFunction: IsGroupFunction = _ => false;
const defaultIsDisorderlyFunction: ObjectIsDisorderlyFunction = () => false;

interface Options {
  isNode: ObjectIsFunction;
  isGroup: IsGroupFunction;
  isDisorderly: ObjectIsDisorderlyFunction;
  generic: string[];
  debug: boolean;
}
const defaultOptions: Options = {
  isNode: defaultIsAtomicFunction,
  isGroup: defaultIsGroupFunction,
  isDisorderly: defaultIsDisorderlyFunction,
  generic: ["one", "some", "any"],
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
  const generic = opts.generic || defaultOptions.generic;
  let groups: { [key: string]: any } = {};
  while (i < tmpl.length || j < obj.length) {
    const tmplElement = tmpl[i];
    const objElement = obj[j];
    let matched = patternMatch(tmplElement, objElement, opts);

    const key: false | GroupResult = isGroup(tmplElement);

    if (key) {
      const happyEnd: T[] = tmpl.slice(i + 1);
      let thisGroup: MatchedList = [];
      if (opts.debug) console.log("happyEnd", happyEnd);
      if (happyEnd.length === 0) {
        if (opts.debug) console.log("obj.slice(j) =", obj.slice(j));
        thisGroup = key.type === "SINGLE" ? obj[j] : obj.slice(j);
        groups = matchedListMerge(groups, { [key.as]: thisGroup }, generic);
        break;
      }

      // tmplが[0,*,2,3]で現在"*"の時、[2,3]をhappyEndとし、[0,4,5,6,2,3]からtailして行って[2,3]と一致するまで待つ
      switch (key.type) {
        case "MULTIPLE":
        case "ANY":
          while (
            (matched = patternMatch(happyEnd, obj.slice(j), opts)) === false
          ) {
            if (opts.debug) console.log("obj.slice(j):", obj.slice(j));
            if (opts.debug) console.log("matched:", matched, happyEnd);

            thisGroup.push(obj[j]);
            j++;
            if (obj.slice(j).length === 0) {
              if (opts.debug) console.log("tail(obj).length == 0");

              return false;
            }
          }

          if (opts.debug) console.log({ groups });
          j--;
          if (opts.debug)
            console.log("matched:", i, tmpl[i], j, obj[j], matched, thisGroup);
          matched = matchedListMerge(matched, { [key.as]: thisGroup }, generic);
          break;
        case "SINGLE":
          const localMatched = patternMatch(happyEnd, obj.slice(j + 1), opts);
          if (localMatched === false) {
            return false;
          }
          delete localMatched[key.as];
          matched = { [key.as]: obj[j] };
          if (opts.debug) console.log({ groups });
          break;
      }
    }
    if (matched === false) {
      if (opts.debug) console.log("match failed");
      return false;
    } else {
      groups = matchedListMerge(groups, matched, generic);
    }

    // ここにpatternMatchからのデータがある場合の処理を書く
    if (opts.debug) console.log({ groups });

    i++;
    j++;
  }
  return groups;
};

const patternMatchDisorderlyArray = <T extends IObject, O extends IObject>(
  tmpl: T[],
  obj: O[],
  opts: Partial<Options> = defaultOptions
): MatchedList | false => {
  if (opts.debug)
    console.log("patternMatchDisorderlyArray(", tmpl, ",", obj, ")");
  const isGroup = opts.isGroup || defaultOptions.isGroup;
  const generic = opts.generic || defaultOptions.generic;

  let groups: MatchedList = {};
  const groupingTmpls = tmpl.filter(t => isGroup(t) !== false);
  const notGroupingTmpls = tmpl.filter(t => isGroup(t) === false);
  if (groupingTmpls.length === 0) {
    if (opts.debug) console.log("groupedTmpl(", groupingTmpls, ")");
    if (tmpl.length !== obj.length) {
      if (opts.debug)
        console.log(
          "tmpl.length = ",
          tmpl.length,
          " =/= obj.length = ",
          obj.length
        );
      return false;
    }

    let objCache = [...obj];
    for (const i in tmpl) {
      const newObjCache = objCache.filter(o => {
        const matched = patternMatch(tmpl[i], o, opts);
        if (matched) {
          groups = { ...groups, ...matched };
          return false;
        }
        return true;
      });
      if (opts.debug)
        console.log("disorderly array matching loop", {
          objCache,
          newObjCache,
          "tmpl[i]": tmpl[i]
        });

      if (newObjCache.length === objCache.length) {
        if (opts.debug)
          console.log("newObjCache doesn't decrease", {
            objCache: JSON.stringify(objCache),
            newObjCache: JSON.stringify(newObjCache),
            "tmpl[i]": tmpl[i]
          });
        return false;
      }

      objCache = newObjCache;
    }
  } else {
    const groupingTmpl = groupingTmpls[groupingTmpls.length - 1];

    const restGroup: false | GroupResult = isGroup(groupingTmpl);

    if (!restGroup) {
      return false;
    }

    if (!(restGroup.type === "ANY" || restGroup.type === "MULTIPLE")) {
      return false;
    }

    let objCache = [...obj];
    for (const i in notGroupingTmpls) {
      const newObjCache = objCache.filter(o => {
        const matched = patternMatch(notGroupingTmpls[i], o, opts);
        if (matched) {
          groups = { ...groups, ...matched };
          return false;
        }
        return true;
      });
      if (opts.debug)
        console.log("disorderly array matching loop", {
          objCache,
          newObjCache,
          "tmpl[i]": tmpl[i]
        });

      if (newObjCache.length === objCache.length) {
        if (opts.debug)
          console.log("newObjCache doesn't decrease", {
            objCache: JSON.stringify(objCache),
            newObjCache: JSON.stringify(newObjCache),
            "tmpl[i]": tmpl[i]
          });
        return false;
      }

      objCache = newObjCache;
    }

    groups = matchedListMerge(groups, { [restGroup.as]: objCache }, generic);
  }

  return groups;
};

const patternMatchObject = <T, O>(
  tmpl: IObject,
  obj: IObject,
  opts: Partial<Options> = defaultOptions
): MatchedList | false => {
  if (opts.debug) console.log("patternMatchObject(", tmpl, ",", obj, ")");
  const isDisorderly = opts.isDisorderly || defaultOptions.isDisorderly;
  const generic = opts.generic || defaultOptions.generic;

  const tmplKeys = Object.keys(tmpl);
  const objKeys = Object.keys(obj);

  const disorderlyName = isDisorderly(tmpl);

  let groups: MatchedList = {};

  if (tmplKeys.length !== objKeys.length) {
    if (opts.debug)
      console.log(
        "length don't match:" +
          tmplKeys.length +
          "(tmpl)" +
          "=/=" +
          objKeys.length +
          "(obj)",
        tmplKeys,
        objKeys
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

    const matched =
      disorderlyName === tmplKey
        ? patternMatchDisorderlyArray(tmpl[tmplKey], obj[tmplKey], opts)
        : patternMatch(tmpl[tmplKey], obj[tmplKey], opts);

    if (matched === false) {
      return false;
    }

    groups = matchedListMerge(groups, matched, generic);
  }
  if (opts.debug) console.log({ groups });

  return groups;
};

/**
 * パターンマッチを行う
 * @param tmpl  テンプレートのオブジェクト
 * @param obj   対象のオブジェクト
 * @param opts  オプション
 * @returns マッチに失敗した時、falseを返す
 */
export const patternMatch = (
  tmpl: any,
  obj: any,
  opts: Partial<Options> = defaultOptions
): MatchedList | false => {
  const isNode = opts.isNode || defaultOptions.isNode;
  const isGroup = opts.isGroup || defaultOptions.isGroup;
  const isDisorderly = opts.isDisorderly || defaultOptions.isDisorderly;
  if (opts.debug) console.log(`patternMatch(`, tmpl, `,`, obj, `)`);

  const tmplU = tmpl as unknown;
  const objU = obj as unknown;

  if (isGroup(tmplU)) {
    if (opts.debug) console.log(tmplU, ` is Grouping`);
    const key: false | GroupResult = isGroup(tmplU);

    if (key) {
      if (opts.debug) console.log(`grouped:`, objU, `as`, key);

      switch (key.type) {
        case "SINGLE":
        case "ANY":
          return { [key.as]: objU };
        default:
          return false;
      }
    }
  }

  if (typeof tmpl !== typeof obj) {
    return false;
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
    return patternMatchObject(tmplU, objU, opts);
  }

  if (opts.debug) console.log("type:isEqual", "returns", isEqual(tmpl, obj));
  return isEqual(tmpl, obj) ? {} : false;
};
