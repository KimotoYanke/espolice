const { dir, mount } = require("espolice");
const SubModule = require("./templates/submodules");
const RootDir = dir()
  .otherChildrenFiles(SubModule)
  .haveChildFile(SubModule, "index.js");

mount(RootDir, "./src", {
  usePrettier: true
});
