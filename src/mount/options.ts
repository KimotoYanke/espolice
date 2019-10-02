import * as Prettier from "prettier";
export type Options = {
  loserMode: boolean;
  usePrettier: boolean;
  prettierOptions: Prettier.Options;
  ignore: string[];
};

export const normalizeOptions = (options?: Partial<Options>): Options => {
  if (!options) {
    return normalizeOptions({});
  }
  return {
    loserMode: options.loserMode || false,
    usePrettier: options.usePrettier || false,
    prettierOptions: options.prettierOptions || {},
    ignore: options.ignore || ["node_modules", ".gitignore"]
  };
};
