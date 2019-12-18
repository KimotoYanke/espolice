const { dir, mount } = require("espolice");
const Index = require("./templates/index");
const RootDir = dir().haveChildFile(Index, "index.js");

mount(RootDir, "./src", {
  usePrettier: true
});
