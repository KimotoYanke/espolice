const SubModule = ({ getState, getParent, getPath }) => {
  const p = getPath();
  const subModuleNameKey = "[" + p + "]subModuleName";
  // getPathで得られるパスはユニークであるため、パスを"[]"で囲んで他と区別させる
  const subModuleName = getState(subModuleNameKey)[subModuleNameKey];
  const result = $quasiquote => {
    console.log(
      "sub module loaded",
      /* @literal */ subModuleNameKey + " = @one"
    ); // @literalは@one構文よりも先に処理されるため、このような書き方が可能
    module.exports = /* @unquote */ subModuleName;
  };
  return result;
};

module.exports = SubModule;
