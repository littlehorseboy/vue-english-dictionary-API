import mysql from 'mysql';
import jwt from 'jsonwebtoken';

import config from '../../config/config';

const connectionPool = mysql.createPool({
  connectionLimit: 10, // 限制池子連線人數
  host: config.mysqlHost, // 主機名稱
  user: config.mysqlUserName, // 用戶名稱
  password: config.mysqlPass, // 資料庫密碼
  database: config.mysqlDatabase // 資料庫名稱
});

/** items GET 取得 */
const selectDerivations = () => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((connectionError, connection) => {
      if (connectionError) {
        reject(connectionError);
      } else {
        connection.query(`SELECT
derivationId, derivation, partOfSpeech, derivationChinese, wordId
FROM english_dictionary.derivations`, (error, result) => {
          if (error) {
            console.log('SQL error: ', error);
            reject(error);
          } else {
            resolve(result);
          }
          connection.release();
        });
      }
    });
  });
};

const selectSynonyms = () => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((connectionError, connection) => {
      if (connectionError) {
        reject(connectionError);
      } else {
        connection.query(`SELECT
synonymId, synonym, partOfSpeech, synonymChinese, wordId
FROM english_dictionary.synonyms`, (error, result) => {
          if (error) {
            console.log('SQL error: ', error);
            reject(error);
          } else {
            resolve(result);
          }
          connection.release();
        });
      }
    });
  });
};

const selectAntonyms = () => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((connectionError, connection) => {
      if (connectionError) {
        reject(connectionError);
      } else {
        connection.query(`SELECT
antonymId, antonym, partOfSpeech, antonymChinese, wordId
FROM english_dictionary.antonyms w`, (error, result) => {
          if (error) {
            console.log('SQL error: ', error);
            reject(error);
          } else {
            resolve(result);
          }
          connection.release();
        });
      }
    });
  });
};

const selectSentences = () => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((connectionError, connection) => {
      if (connectionError) {
        reject(connectionError);
      } else {
        connection.query(`SELECT
sentenceId, sentence, sentenceChinese, wordId
FROM english_dictionary.sentences`, (error, result) => {
          if (error) {
            console.log('SQL error: ', error);
            reject(error);
          } else {
            resolve(result);
          }
          connection.release();
        });
      }
    });
  });
};

const selectitems = () => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((connectionError, connection) => {
      if (connectionError) {
        reject(connectionError);
      } else {
        connection.query(`SELECT w.*
FROM english_dictionary.words w`, (error, result) => {
          if (error) {
            console.log('SQL error: ', error);
            reject(error);
          } else {
            const objs = result;
            selectDerivations()
              .then((derivations) => {
                objs.forEach((obj) => {
                  if (!obj.derivations) {
                    obj.derivations = [];
                  }

                  const findConcat = () => {
                    if (derivations.findIndex((item) => {
                      return item.wordId === obj.wordId;
                    }) !== -1) {
                      obj.derivations =
                        obj.derivations.concat(derivations.splice(derivations.findIndex((item) => {
                          return item.wordId === obj.wordId;
                        }), 1));

                      findConcat();
                    }
                  };

                  findConcat();
                });
                selectSynonyms()
                  .then((synonyms) => {
                    objs.forEach((obj) => {
                      if (!obj.synonyms) {
                        obj.synonyms = [];
                      }

                      const findConcat = () => {
                        if (synonyms.findIndex((item) => {
                          return item.wordId === obj.wordId;
                        }) !== -1) {
                          obj.synonyms =
                            obj.synonyms.concat(synonyms.splice(synonyms.findIndex((item) => {
                              return item.wordId === obj.wordId;
                            }), 1));

                          findConcat();
                        }
                      };

                      findConcat();
                    });

                    selectAntonyms()
                      .then((antonyms) => {
                        objs.forEach((obj) => {
                          if (!obj.antonyms) {
                            obj.antonyms = [];
                          }

                          const findConcat = () => {
                            if (antonyms.findIndex((item) => {
                              return item.wordId === obj.wordId;
                            }) !== -1) {
                              obj.antonyms =
                                obj.antonyms.concat(antonyms.splice(antonyms.findIndex((item) => {
                                  return item.wordId === obj.wordId;
                                }), 1));

                              findConcat();
                            }
                          };

                          findConcat();
                        });

                        selectSentences()
                          .then((sentences) => {
                            objs.forEach((obj) => {
                              if (!obj.sentences) {
                                obj.sentences = [];
                              }

                              const findConcat = () => {
                                if (sentences.findIndex((item) => {
                                  return item.wordId === obj.wordId;
                                }) !== -1) {
                                  obj.sentences =
                                    obj.sentences.concat(sentences.splice(sentences.findIndex((item) => {
                                      return item.wordId === obj.wordId;
                                    }), 1));

                                  findConcat();
                                }
                              };

                              findConcat();
                            });

                            resolve(objs);
                          });
                      });
                  });
              });
          }
          connection.release();
        });
      }
    });
  });
};

/** items POST 新增 */
const createitems = (insertValues) => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((connectionError, connection) => {
      if (connectionError) {
        reject(connectionError);
      } else {
        
        connection.query('INSERT INTO english_dictionary.words SET ?', insertValues, (error, result) => {
          if (error) {
            console.log('SQL error: ', error);
            reject(error);
          } else if (result.affectedRows === 1) {
            resolve({
              message: `新增成功! items_id: ${result.insertId}`,
              id: result.insertId
            });
          }
          connection.release();
        });
      }
    });
  });
};

/** items PUT 修改 */
const modifyitems = (insertValues, userId) => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((connectionError, connection) => {
      if (connectionError) {
        reject(connectionError);
      } else {
        connection.query('UPDATE timelineitems SET ? WHERE id= ? ', [insertValues, userId], (error, result) => {
          if (error) {
            console.log('SQL error: ', error);
            reject(error);
          } else if (result.affectedRows === 0) {
            resolve('請確認修改Id!');
          } else if (result.message.match('Changed: 1')) {
            resolve('資料修改成功!');
          } else {
            resolve('資料無異動');
          }
          connection.release();
        });
      }
    });
  });
};

/** items DELETE 新增 */
const deleteitems = (userId) => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((connectionError, connection) => {
      if (connectionError) {
        reject(connectionError);
      } else {
        connection.query('DELETE FROM timelineitems WHERE id = ?', userId, (error, result) => {
          if (error) {
            console.log('SQL error: ', error);
            reject(error);
          } else if (result.affectedRows === 1) {
            resolve('刪除成功');
          } else {
            resolve('刪除失敗');
          }
          connection.release();
        });
      }
    });
  });
};

/** items GET JWT取得個人文章 */
const selectPersonalitems = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, 'my_secret_key', (err, decoded) => {
      if (err) {
        reject(err); // 驗證失敗
      } else {
        // JWT 驗證成功 -> 取得用戶 user_id
        const userId = decoded.payload.user_id;
        connectionPool.getConnection((connectionError, connection) => {
          if (connectionError) {
            reject(connectionError);
          } else {
            connection.query('SELECT * FROM items WHERE user_id = ?', userId, (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
              connection.release();
            });
          }
        });
        // resolve(decoded); // 驗證成功回傳 decoded data
      }
    });
  });
};

export default {
  selectitems,
  createitems,
  modifyitems,
  deleteitems,
  selectPersonalitems
};
