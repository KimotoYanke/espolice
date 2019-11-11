export type MatchedList = {
  [key: string]: any;
  [key: number]: any;
};

export type ObjectIsFunction = (obj: any) => boolean;
export type GroupResult = { type: "MULTIPLE" | "SINGLE" | "ANY"; as: string };
export type IsGroupFunction = (obj: any) => GroupResult | false;
export type FromGroupFunction = (obj: GroupResult) => any | false;
export type ObjectIsDisorderlyFunction = (obj: object) => false | string;
const defaultIsAtomicFunction: ObjectIsFunction = () => true;
const defaultIsGroupFunction: IsGroupFunction = _ => false;
const defaultFromGroupFunction: FromGroupFunction = _ => false;
const defaultIsDisorderlyFunction: ObjectIsDisorderlyFunction = () => false;

export interface MatchOptions {
  isNode: ObjectIsFunction;
  isGroup: IsGroupFunction;
  fromGroup: FromGroupFunction;
  isDisorderly: ObjectIsDisorderlyFunction;
  generic: string[];
  formerMatchedList: MatchedList;
  debug: boolean;
}
export const defaultOptions: MatchOptions = {
  isNode: defaultIsAtomicFunction,
  isGroup: defaultIsGroupFunction,
  fromGroup: defaultFromGroupFunction,
  isDisorderly: defaultIsDisorderlyFunction,
  generic: ["one", "some", "any"],
  formerMatchedList: {},
  debug: false
};
