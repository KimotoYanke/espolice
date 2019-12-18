const IndexFile = ({ getState, getParent, getPath }) => {
  const appName = getState("appName")["appName"]; // appNameのASTを取得
  return $quasiquote => {
    console.log("Started app:", "appName = @one"); // ここに書いた文字列が
    console.log("Finished app:", /* @unquote */ appName); // こちらに展開される
  };
};
module.exports = IndexFile;
