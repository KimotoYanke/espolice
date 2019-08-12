export type MatchedList = {
  [key: string]: any;
  [key: number]: any;
};

export const matchedListMerge = (
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

export interface MatchOptions {
  isNode: ObjectIsFunction;
  isGroup: IsGroupFunction;
  isDisorderly: ObjectIsDisorderlyFunction;
  generic: string[];
  debug: boolean;
}
export const defaultOptions: MatchOptions = {
  isNode: defaultIsAtomicFunction,
  isGroup: defaultIsGroupFunction,
  isDisorderly: defaultIsDisorderlyFunction,
  generic: ["one", "some", "any"],
  debug: false
};
