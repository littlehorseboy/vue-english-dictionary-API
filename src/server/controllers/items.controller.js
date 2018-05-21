import itemsModule from '../modules/items.module';

/** items GET 取得 */
const itemsGet = (req, res) => {
  itemsModule.selectitems().then((result) => {
    res.send(result);
  }).catch((err) => {
    return res.send(err);
  });
};

/** items POST 新增 */
const itemsPost = (req, res) => {
  // 取得新增參數
  const insertValues = req.body;
  itemsModule.createitems(insertValues).then((result) => {
    res.send(result);
  }).catch((err) => {
    return res.send(err);
  });
};

/** items PUT 修改 */
const itemsPut = (req, res) => {
  // 取得修改id
  const userId = req.params.items_id;
  // 取得新增參數
  const insertValues = req.body;
  itemsModule.modifyitems(insertValues, userId).then((result) => {
    res.send(result);
  }).catch((err) => {
    return res.send(err);
  });
};

/** items DELETE 新增 */
const itemsDelete = (req, res) => {
  // 取得刪除id
  const userId = req.params.items_id;
  itemsModule.deleteitems(userId).then((result) => {
    res.send(result);
  }).catch((err) => {
    return res.send(err);
  });
};

/** items GET JWT取得個人文章 */
const itemsPersonalGet = (req, res) => {
  itemsModule.selectPersonalitems(req.token).then((result) => {
    res.send(result);
  }).catch((err) => {
    return res.status(401).send(err);
  });
};

export default {
  itemsGet,
  itemsPost,
  itemsPut,
  itemsDelete,
  itemsPersonalGet
};
