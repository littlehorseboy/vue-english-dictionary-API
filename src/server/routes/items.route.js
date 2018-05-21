import express from 'express';
import validate from 'express-validation';

import itemsCtrl from '../controllers/items.controller';
import paramValidation from '../../config/param-validation';

const router = express.Router();

router.route('/')
  .get(itemsCtrl.itemsGet) /** 取得 items 所有值組 */
  .post(itemsCtrl.itemsPost); /** 新增 items 值組 */

router.route('/:items_id')
  .put(itemsCtrl.itemsPut) /** 修改 Article 值組 */
  .delete(itemsCtrl.itemsDelete); /** 刪除 Article 值組 */

// /** 利用 Middleware 取得 Header 中的 Bearer Token */
// const ensureToken = (req, res, next) => {
//   const bearerHeader = req.headers.authorization;
//   if (typeof bearerHeader !== 'undefined') {
//     const bearer = bearerHeader.split(' '); // 字串切割
//     const bearerToken = bearer[1]; // 取得JWT
//     req.token = bearerToken; // 在 response 中建立一個 token 參數
//     next(); // 結束 Middleware 進入 articleCtrl.articlePersonalGet
//   } else {
//     res.status(403).send(Object.assign(
//       { code: 403 },
//       { message: '您尚未登入!' }
//     )); // Header 查無 Bearer Token
//   }
// };

// /** 取得某用戶的 Article 所有值組 */
// router.get('/personal', ensureToken, articleCtrl.articlePersonalGet);

export default router;
