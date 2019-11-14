const { dir, mount } = require("espolice");
const SubModule = require("./templates/submodules");
const Index = ({ getState, getParent, getPath }) => {
  const appName = getState("appName")["appName"];
  const files = getParent().childrenFiles;
  return $quasiquote => {
    console.log("appName = @one", "started!");
    console.log("finished: ", /* @unquote */ appName);
    /* @unquote-splicing */
    files
      .filter(file => file !== "index.js")
      .map(file => {
        return $quasiquote => require(/* @literal */ "./" + file);
      });
  };
};
const RootDir = dir().haveChildFile(Index, "index.js");

mount(RootDir, "./src", {
  usePrettier: true
});
