import * as Prettier from "prettier";
import { boolean } from "@oclif/parser/lib/flags";
export type Options = {
  loserMode: boolean;
  usePrettier: boolean;
  prettierOptions: Prettier.Options;
  ignore: string[];
  partial: boolean;
  ext: string[];
};

export const normalizeOptions = (options?: Partial<Options>): Options => {
  if (!options) {
    return normalizeOptions({});
  }
  return {
    loserMode: options.loserMode || false,
    usePrettier: options.usePrettier || false,
    prettierOptions: options.prettierOptions || { parser: "babel" },
    ignore: options.ignore || ["node_modules", ".gitignore", ".git"],
    partial: true,
    ext: [".js"]
  };
};
