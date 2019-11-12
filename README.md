# espolice

espolice は Source2Source に影響を受けたコーディング支援システムで、

1. プログラミングの効率の強化
2. コーディングルールから外れたコードの排除

の二つを行います。

espolice では、まずプロジェクトの管理者が「コーディングルール」を定めます。このコーディングルールは Source2Source と比較すると書きやすくなっています。

プログラマは、コーディング中 espolice をバックグラウンドで起動させておきます。espolice は絶えずファイルシステムの監視を行い、また能動的な介入を行います。

例えば、

- ファイル新規作成(`touch`)だけでテンプレートを展開

```shell
touch a.js
```

```javascript 
module.exports = () => {};
```

- 配下ファイルが作成されると、`index.js`に登録コードを追加

```shell
touch a.js
mkdir dir
```

```javascript
const { Router } = require("express");

const router = Router();
router.use("/a", require("./a.js"));
router.use("/dir", require("./dir"));
module.exports = router;
```

- 状態の管理

```javascript
import { Router } from "express";
const router = Router();
router.get("/", (req, res, next) => {
  console.log("GET", "index"); // <- "index"を変化させると
});
router.post("/", (req, res, next) => {
  console.log("POST", "index"); // <-
});
export default router;
```

```javascript
import { Router } from "express";
const router = Router();
router.get("/", (req, res, next) => {
  console.log("GET", "root"); // <- "index"を変化させると
});
router.post("/", (req, res, next) => {
  console.log("POST", "root"); // <- こちらも変化する
});
export default router;
```

といったことが可能となります。
