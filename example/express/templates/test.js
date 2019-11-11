const TestIndex = ({ getState, getParent, getPath }) => {
  return $quasiquote => {
    console.log("appName = @one", "is started");
    console.log("enabled: ", "moduleNames = @some");
    ("@any");
  };
};
const TestSubmodule = ({ getState, getParent, getPath }) => {
  const state = getState("appName", "moduleNames");
  return $quasiquote => {
    console.log("disabled: ", /* @unquote-splicing */ state.moduleNames);
    console.log(/* @unquote */ state.appName, "is finishing");
    ("@any");
  };
};
export { TestIndex, TestSubmodule };
