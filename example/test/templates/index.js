const IndexFile = ({ getState, getParent, getPath }) => {
  const appName = getState("appName")["appName"]; // appNameのASTを取得
  return $quasiquote => {
    console.log("Started app:", "appName = @one"); // ここに書いた文字列が
    ("a=@one");
    ("@any");
    ("@any");
    ("a=@one");
    console.log("Finished app:", "appName = @one"); // こちらに展開される
  };
};
module.exports = IndexFile;
