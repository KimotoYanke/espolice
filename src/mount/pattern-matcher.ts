import { isEqual, memoize } from "lodash";
const sortObject = (o: { [key: string]: any; [key: number]: any }) => {
  const keys = Object.keys(o);
  keys.sort();
  return keys.map(k => o[k]);
};

type Matched<T, O> = {
  matched: {
    [key: string]: any;
    [key: number]: any;
  };
};

type ObjectIsFunction = (obj: object) => boolean;
type GroupFunction = (obj: any) => string | false;
const defaultIsAtomicFunction: ObjectIsFunction = () => false;
const defaultIsGroupFunction: GroupFunction = () => false;

type Options = {
  isAtomic?: ObjectIsFunction;
  isGroup?: GroupFunction;
};
const defaultOptions = {
  isAtomic: defaultIsAtomicFunction,
  isGroup: defaultIsGroupFunction
};

const patternMatchArray = <T, O>(
  tmpl: T[],
  obj: O[],
  opts: Options = defaultOptions
): Matched<T, O> | boolean => {
  let i = 0,
    j = 0;
  const isGroup = opts.isGroup || defaultIsGroupFunction;
  const groups: { [key: string]: any } = {};
  while (i < tmpl.length || j < obj.length) {
    const tE = tmpl[i];
    const oE = obj[j];

    const result = patternMatch(tE, oE, opts);
    const key = isGroup(tE);
    if (result === false && key) {
      const happyEnd: T[] = tmpl.slice(i + 1, -1);
      if (happyEnd.length === 0) {
        groups[key] = obj.slice(j, -1);
        continue;
      } else {
        groups[key] = [];
      }

      while (!patternMatch(happyEnd, obj.slice(j, -1))) {
        groups[key].push(obj[j]);
        j++;
        if (obj.slice(j, -1).length === 0) {
          return false;
        }
      }
      j--;
    } else if (result === false) {
      return false;
    }
    // ここにpatternMatchからのデータがある場合の処理を書く
    i++;
    j++;
  }
  return { matched: groups };
};

export const patternMatch = <T, O>(
  tmpl: T,
  obj: O,
  opts: Options = defaultOptions
): Matched<T, O> | boolean => {
  const isAtomic = opts.isAtomic || defaultIsAtomicFunction;

  if (typeof tmpl !== typeof obj) {
    return false;
  }
  const tmplU = tmpl as unknown;
  const objU = obj as unknown;
  if (
    typeof tmplU === "object" &&
    typeof objU === "object" &&
    tmplU !== null &&
    objU !== null
  ) {
    if (isAtomic(tmplU) || isAtomic(objU)) {
      return isEqual(tmpl, obj);
    }
  }

  if (tmpl instanceof Array && obj instanceof Array) {
    return patternMatchArray(tmpl, obj, opts);
  }
  return isEqual(tmpl, obj);
};
