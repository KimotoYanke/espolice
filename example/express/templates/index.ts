import { FileNodeRule } from "../../../src/rule/file";
export const Index: FileNodeRule = ({ parent }) => {
  //@ts-ignore
  return $quasiquote => {
    // @ts-ignore
    export default () => {
      "@any";
    };
  };
};
