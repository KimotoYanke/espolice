const { dir, mount } = require("espolice");
const SubModule = require("./templates/submodules");
const RootDir = dir().otherChildrenFiles(SubModule);

mount(RootDir, "./src", {
  usePrettier: true
});
