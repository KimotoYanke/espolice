import { FileNodeRule } from "../../../src/rule/file";
export const Index: FileNodeRule<{ moduleName: string }> = ({
  moduleName,
  parent
}) => {
  console.log(
    // @literal
    moduleName
  );

  //@ts-ignore
  return $quasiquote => {
    // @ts-ignore
    export default () => {
      "@any";
    };
  };
};
