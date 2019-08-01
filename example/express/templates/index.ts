import { FileNodeRule } from "../../../src/rule/file";
export const Index: FileNodeRule = ({ parent }) => {
  return $quasiquote => {
    // @ts-ignore
    export default () => {
      "@any";
    };
  };
};
