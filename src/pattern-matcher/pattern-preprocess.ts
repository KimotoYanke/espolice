import {
  MatchOptions,
  MatchedList,
  defaultOptions,
  GroupResult
} from "./matched-list";
import { fromGroup } from "../node/is-group";

const patternPreprocessWithCount = <T>(
  tmpl: T,
  opts: Partial<MatchOptions> = defaultOptions,
  count: number
): [T, number] => {
  const isGroup = opts.isGroup || defaultOptions.isGroup;
  const generic = opts.generic || defaultOptions.generic;

  const tmplU = tmpl as unknown;

  /*if (opts.debug)
    console.log("patternPreprocess", { tmpl }, "isGroup", isGroup(tmplU));
  if (opts.debug) console.log("generic", generic);*/
  if (isGroup(tmplU)) {
    const key: false | GroupResult = isGroup(tmplU);

    if (key && generic.includes(key.as)) {
      return [fromGroup({ ...key, as: key.as + "_" + count }), count + 1];
    }
  }

  if (tmpl instanceof Array) {
    for (let i = 0; i < tmpl.length; i++) {
      [tmpl[i], count] = patternPreprocessWithCount(tmpl[i], opts, count);
    }
    return [tmpl, count];
  }

  if (typeof tmpl === "object" && tmpl !== null) {
    for (let key in tmpl) {
      [tmpl[key], count] = patternPreprocessWithCount(tmpl[key], opts, count);
    }
    return [tmpl, count];
  }
  return [tmpl, count];
};

export const patternPreprocess = <T>(
  tmpl: T,
  opts: Partial<MatchOptions> = defaultOptions
): T => {
  return patternPreprocessWithCount(tmpl, opts, 0)[0];
};
