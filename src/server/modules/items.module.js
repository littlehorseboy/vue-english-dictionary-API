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
        const derivations = [];
        const synonyms = [];
        const antonyms = [];
        const sentences = [];

        insertValues.forEach((insertValue) => {
          insertValue.derivations.forEach((derivation) => {
            derivation.wordId = insertValue.wordId;
            derivations.push(derivation);
          });
          insertValue.synonyms.forEach((synonym) => {
            synonym.wordId = insertValue.wordId;
            synonyms.push(synonym);
          });
          insertValue.antonyms.forEach((antonym) => {
            antonym.wordId = insertValue.wordId;
            antonyms.push(antonym);
          });
          insertValue.sentences.forEach((sentence) => {
            sentence.wordId = insertValue.wordId;
            sentences.push(sentence);
          });

          delete insertValue.derivations;
          delete insertValue.synonyms;
          delete insertValue.antonyms;
          delete insertValue.sentences;
        });

        let insertWordsSqlString = '';
        let insertDerivationsSqlString = '';
        let insertSynonymsSqlString = '';
        let insertAntonymsSqlString = '';
        let insertSentencesSqlString = '';

        let sql = '';
        const wordsArray = [];
        for (let i = 0; i < insertValues.length; i += 1) {
          if (i === 0) {
            sql = `INSERT INTO english_dictionary.words (${Object.keys(insertValues[i]).join(',')}) VALUES ?`;
          }
          wordsArray.push(Object.values(insertValues[i]));
        }
        sql = mysql.format(sql, [wordsArray]);
        insertWordsSqlString = sql;

        let sql2 = '';
        const derivationsArray = [];
        for (let i = 0; i < derivations.length; i += 1) {
          if (i === 0) {
            sql2 = `INSERT INTO english_dictionary.derivations (${Object.keys(derivations[i]).join(',')}) VALUES ?`;
          }
          derivationsArray.push(Object.values(derivations[i]));
        }
        sql2 = mysql.format(sql2, [derivationsArray]);
        insertDerivationsSqlString = sql2;

        let sql3 = '';
        const synonymsArray = [];
        for (let i = 0; i < synonyms.length; i += 1) {
          if (i === 0) {
            sql3 = `INSERT INTO english_dictionary.synonyms (${Object.keys(synonyms[i]).join(',')}) VALUES ?`;
          }
          synonymsArray.push(Object.values(synonyms[i]));
        }
        sql3 = mysql.format(sql3, [synonymsArray]);
        insertSynonymsSqlString = sql3;

        let sql4 = '';
        const antonymsArray = [];
        for (let i = 0; i < antonyms.length; i += 1) {
          if (i === 0) {
            sql4 = `INSERT INTO english_dictionary.antonyms (${Object.keys(antonyms[i]).join(',')}) VALUES ?`;
          }
          antonymsArray.push(Object.values(antonyms[i]));
        }
        sql4 = mysql.format(sql4, [antonymsArray]);
        insertAntonymsSqlString = sql4;

        let sql5 = '';
        const sentencesArray = [];
        for (let i = 0; i < sentences.length; i += 1) {
          if (i === 0) {
            sql5 = `INSERT INTO english_dictionary.sentences (${Object.keys(sentences[i]).join(',')}) VALUES ?`;
          }
          sentencesArray.push(Object.values(sentences[i]));
        }
        sql5 = mysql.format(sql5, [sentencesArray]);
        insertSentencesSqlString = sql5;

        // insertValues.forEach((insertValue) => {
        //   let sql = 'INSERT INTO english_dictionary.words SET ?;';
        //   sql = mysql.format(sql, insertValue);
        //   sqlString += sql;
        // });
        // derivations.forEach((insertValue) => {
        //   let sql = 'INSERT INTO english_dictionary.derivations SET ?;';
        //   sql = mysql.format(sql, insertValue);
        //   sqlString += sql;
        // });
        // synonyms.forEach((insertValue) => {
        //   let sql = 'INSERT INTO english_dictionary.synonyms SET ?;';
        //   sql = mysql.format(sql, insertValue);
        //   sqlString += sql;
        // });
        // antonyms.forEach((insertValue) => {
        //   let sql = 'INSERT INTO english_dictionary.antonyms SET ?;';
        //   sql = mysql.format(sql, insertValue);
        //   sqlString += sql;
        // });
        // sentences.forEach((insertValue) => {
        //   let sql = 'INSERT INTO english_dictionary.sentences SET ?;';
        //   sql = mysql.format(sql, insertValue);
        //   sqlString += sql;
        // });

        console.log(insertWordsSqlString);
        console.log(insertDerivationsSqlString);
        console.log(insertSynonymsSqlString);
        console.log(insertAntonymsSqlString);
        console.log(insertSentencesSqlString);

        const aaa = [];
        aaa.push(insertWordsSqlString);
        aaa.push(insertDerivationsSqlString);
        aaa.push(insertSynonymsSqlString);
        aaa.push(insertAntonymsSqlString);
        aaa.push(insertSentencesSqlString);

        const querysFunc = (queryStrings) => {
          const end = queryStrings.length;
          let start = 0;
          const queryFunc = (queryString) => {
            connection.query(queryString, (error, result) => {
              const checkQuery = (y, n) => {
                start += 1;
                if (start < end) {
                  queryFunc(queryStrings[start]);
                } else {
                  console.log('會執行到這邊嗎?');
                  connection.release();
                  resolve({
                    message: '新增成功!',
                    id: 3345678
                  });
                }
              };

              if (error) {
                console.log('SQL error: ', error);
                checkQuery(0, 1);
                // reject(error);
              } else {
                console.log(result);
                checkQuery(1, 0);
                // resolve({
                //   message: `新增成功! items_id: ${result.insertId}`,
                //   id: result.insertId
                // });
              }

              connection.release();
            });
          };

          queryFunc(queryStrings[start]);
        };

        querysFunc(aaa.filter((item) => {
          return item !== '';
        }));
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
