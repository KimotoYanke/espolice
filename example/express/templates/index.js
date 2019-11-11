// express.jsにおけるindex.jsの定義例
const path = require("path");

const RouteIndex = ({ getState, getParent }) => {
  const parent = getParent();
  const result = $quasiquote => {
    const { Router } = require("express");
    const router = Router();

    /* @unquote-splicing */
    parent.childrenDirs // 親の子ファイルつまり自分含む兄弟ディレクトリ一覧リスト
      .map(
        // map関数で子ファイルのパスからrouter.use関数へ
        childDir => $quasiquote =>
          router.use(
            /* @literal */
            "/" + childDir, // URLの指定のため拡張子削除の整形を行う
            require(//@literal
            "./" + childDir)
          )
      );

    /* @unquote-splicing */
    parent.childrenFiles // 親の子ファイルつまり自分含む兄弟ファイル一覧リスト
      .filter(childrenFile => childrenFile !== "index.js") // filter関数でindex.jsを削除
      .map(
        // map関数で子ファイルのパスからrouter.use関数へ
        childFile => $quasiquote =>
          router.use(
            /* @literal */
            "/" + path.basename(childFile, ".js"),
            require(//@literal
            "./" + childFile)
          )
      );
    module.exports = router;
  };
  return result;
};

module.exports = RouteIndex;
