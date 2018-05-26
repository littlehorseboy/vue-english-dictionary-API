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
        connection.query(`SELECT wordId, word, kkPhoneticSymbols, partOfSpeech, chinese
FROM english_dictionary.words`, (error, result) => {
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
        // 會一次對五張表新增 先組字串來判斷哪幾張表需要新增
        // 先將物件內的陣列拆分
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

        // 下面對五個變數組出 SQL 字串 push 進
        // 最後會去除空白字串的陣列元素
        const insertWordsSqlStrings = [];

        let sql = '';
        const wordsArray = [];
        for (let i = 0; i < insertValues.length; i += 1) {
          if (i === 0) {
            sql = `INSERT INTO english_dictionary.words (${Object.keys(insertValues[i]).join(',')}) VALUES ?`;
          }
          wordsArray.push(Object.values(insertValues[i]));
        }
        sql = mysql.format(sql, [wordsArray]);
        insertWordsSqlStrings.push(sql);

        let sql2 = '';
        const derivationsArray = [];
        for (let i = 0; i < derivations.length; i += 1) {
          if (i === 0) {
            sql2 = `INSERT INTO english_dictionary.derivations (${Object.keys(derivations[i]).join(',')}) VALUES ?`;
          }
          derivationsArray.push(Object.values(derivations[i]));
        }
        sql2 = mysql.format(sql2, [derivationsArray]);
        insertWordsSqlStrings.push(sql2);

        let sql3 = '';
        const synonymsArray = [];
        for (let i = 0; i < synonyms.length; i += 1) {
          if (i === 0) {
            sql3 = `INSERT INTO english_dictionary.synonyms (${Object.keys(synonyms[i]).join(',')}) VALUES ?`;
          }
          synonymsArray.push(Object.values(synonyms[i]));
        }
        sql3 = mysql.format(sql3, [synonymsArray]);
        insertWordsSqlStrings.push(sql3);

        let sql4 = '';
        const antonymsArray = [];
        for (let i = 0; i < antonyms.length; i += 1) {
          if (i === 0) {
            sql4 = `INSERT INTO english_dictionary.antonyms (${Object.keys(antonyms[i]).join(',')}) VALUES ?`;
          }
          antonymsArray.push(Object.values(antonyms[i]));
        }
        sql4 = mysql.format(sql4, [antonymsArray]);
        insertWordsSqlStrings.push(sql4);

        let sql5 = '';
        const sentencesArray = [];
        for (let i = 0; i < sentences.length; i += 1) {
          if (i === 0) {
            sql5 = `INSERT INTO english_dictionary.sentences (${Object.keys(sentences[i]).join(',')}) VALUES ?`;
          }
          sentencesArray.push(Object.values(sentences[i]));
        }
        sql5 = mysql.format(sql5, [sentencesArray]);
        insertWordsSqlStrings.push(sql5);

        /**
         * 得到 SQL 字串陣列 非同步遞迴依序執行 應該有非同步吧0.0
         * @param {Array} queryStrings SQL 字串陣列
         */
        const querysFunc = (queryStrings) => {
          const end = queryStrings.length; // 陣列長度
          let start = 0; // 遞迴用起始值
          const count = {
            successCount: 0, // 執行 SQL 成功次數
            failCount: 0 // 執行 SQL 失敗次數
          };

          /**
           * 執行 SQL
           * @param {String} queryString 一句 SQL
           */
          const queryFunc = (queryString) => {
            connection.query(queryString, (error, result) => {
              /**
               * 計算成功失敗 遞迴最後 resolve
               * @param {Number} successN
               * @param {Number} failN
               */
              const checkQuery = (successN, failN) => {
                start += 1;

                count.successCount += successN;
                count.failCount += failN;

                if (start < end) {
                  queryFunc(queryStrings[start]);
                } else {
                  if (count.successCount === end) {
                    resolve({
                      message: '新增成功!'
                    });
                  } else if (count.failCount === end) {
                    reject(count); // horseTODO
                  } else {
                    reject(count); // horseTODO
                  }

                  connection.release();
                }
              };

              if (error) {
                console.log('SQL error: ', error);
                checkQuery(0, 1);
              } else {
                console.log(result);
                checkQuery(1, 0);
              }
            });
          };

          queryFunc(queryStrings[start]);
        };

        // 排除是空白字串的陣列元素
        const insertWordsSqlStringsNoEmpty = insertWordsSqlStrings.filter((item) => {
          return item !== '';
        });

        console.log(insertWordsSqlStringsNoEmpty);

        querysFunc(insertWordsSqlStringsNoEmpty);
      }
    });
  });
};

/** items PUT 修改 */
const modifyitems = (updateValues) => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((connectionError, connection) => {
      if (connectionError) {
        reject(connectionError);
      } else {
        const Ids = [];
        updateValues.forEach((updateValue) => {
          Ids.push(updateValue.wordId);
        });

        connection.query('DELETE FROM words WHERE wordId in (?)', [Ids], (error, result) => {
          if (error) {
            console.log('SQL error: ', error);
            reject(error);
          } else if (result.affectedRows > 0) {
            // 會一次對五張表新增 先組字串來判斷哪幾張表需要新增
            // 先將物件內的陣列拆分
            const derivations = [];
            const synonyms = [];
            const antonyms = [];
            const sentences = [];

            updateValues.forEach((updateValue) => {
              updateValue.derivations.forEach((derivation) => {
                derivation.wordId = updateValue.wordId;
                derivations.push(derivation);
              });
              updateValue.synonyms.forEach((synonym) => {
                synonym.wordId = updateValue.wordId;
                synonyms.push(synonym);
              });
              updateValue.antonyms.forEach((antonym) => {
                antonym.wordId = updateValue.wordId;
                antonyms.push(antonym);
              });
              updateValue.sentences.forEach((sentence) => {
                sentence.wordId = updateValue.wordId;
                sentences.push(sentence);
              });

              delete updateValue.derivations;
              delete updateValue.synonyms;
              delete updateValue.antonyms;
              delete updateValue.sentences;
            });

            // 下面對五個變數組出 SQL 字串 push 進
            // 最後會去除空白字串的陣列元素
            const updateWordsSqlStrings = [];

            let sql = '';
            const wordsArray = [];
            for (let i = 0; i < updateValues.length; i += 1) {
              if (i === 0) {
                sql = `INSERT INTO english_dictionary.words (${Object.keys(updateValues[i]).join(',')}) VALUES ?`;
              }
              wordsArray.push(Object.values(updateValues[i]));
            }
            sql = mysql.format(sql, [wordsArray]);
            updateWordsSqlStrings.push(sql);

            let sql2 = '';
            const derivationsArray = [];
            for (let i = 0; i < derivations.length; i += 1) {
              if (i === 0) {
                sql2 = `INSERT INTO english_dictionary.derivations (${Object.keys(derivations[i]).join(',')}) VALUES ?`;
              }
              derivationsArray.push(Object.values(derivations[i]));
            }
            sql2 = mysql.format(sql2, [derivationsArray]);
            updateWordsSqlStrings.push(sql2);

            let sql3 = '';
            const synonymsArray = [];
            for (let i = 0; i < synonyms.length; i += 1) {
              if (i === 0) {
                sql3 = `INSERT INTO english_dictionary.synonyms (${Object.keys(synonyms[i]).join(',')}) VALUES ?`;
              }
              synonymsArray.push(Object.values(synonyms[i]));
            }
            sql3 = mysql.format(sql3, [synonymsArray]);
            updateWordsSqlStrings.push(sql3);

            let sql4 = '';
            const antonymsArray = [];
            for (let i = 0; i < antonyms.length; i += 1) {
              if (i === 0) {
                sql4 = `INSERT INTO english_dictionary.antonyms (${Object.keys(antonyms[i]).join(',')}) VALUES ?`;
              }
              antonymsArray.push(Object.values(antonyms[i]));
            }
            sql4 = mysql.format(sql4, [antonymsArray]);
            updateWordsSqlStrings.push(sql4);

            let sql5 = '';
            const sentencesArray = [];
            for (let i = 0; i < sentences.length; i += 1) {
              if (i === 0) {
                sql5 = `INSERT INTO english_dictionary.sentences (${Object.keys(sentences[i]).join(',')}) VALUES ?`;
              }
              sentencesArray.push(Object.values(sentences[i]));
            }
            sql5 = mysql.format(sql5, [sentencesArray]);
            updateWordsSqlStrings.push(sql5);

            /**
             * 得到 SQL 字串陣列 非同步遞迴依序執行 應該有非同步吧0.0
             * @param {Array} queryStrings SQL 字串陣列
             */
            const querysFunc = (queryStrings) => {
              const end = queryStrings.length; // 陣列長度
              let start = 0; // 遞迴用起始值
              const count = {
                successCount: 0, // 執行 SQL 成功次數
                failCount: 0 // 執行 SQL 失敗次數
              };

              /**
               * 執行 SQL
               * @param {String} queryString 一句 SQL
               */
              const queryFunc = (queryString) => {
                connection.query(queryString, (error, result) => {
                  /**
                   * 計算成功失敗 遞迴最後 resolve
                   * @param {Number} successN
                   * @param {Number} failN
                   */
                  const checkQuery = (successN, failN) => {
                    start += 1;

                    count.successCount += successN;
                    count.failCount += failN;

                    if (start < end) {
                      queryFunc(queryStrings[start]);
                    } else {
                      if (count.successCount === end) {
                        resolve({
                          message: '新增成功!'
                        });
                      } else if (count.failCount === end) {
                        reject(count); // horseTODO
                      } else {
                        reject(count); // horseTODO
                      }

                      connection.release();
                    }
                  };

                  if (error) {
                    console.log('SQL error: ', error);
                    checkQuery(0, 1);
                  } else {
                    console.log(result);
                    checkQuery(1, 0);
                  }
                });
              };

              queryFunc(queryStrings[start]);
            };

            // 排除是空白字串的陣列元素
            const updateWordsSqlStringsNoEmpty = updateWordsSqlStrings.filter((item) => {
              return item !== '';
            });

            console.log(updateWordsSqlStringsNoEmpty);

            querysFunc(updateWordsSqlStringsNoEmpty);
          } else {
            resolve('這些資料不存在');
          }
        });
      }
    });
  });
};

/** items DELETE 新增 */
const deleteitems = (Ids) => {
  return new Promise((resolve, reject) => {
    connectionPool.getConnection((connectionError, connection) => {
      if (connectionError) {
        reject(connectionError);
      } else {
        connection.query('DELETE FROM words WHERE wordId in (?)', [Ids], (error, result) => {
          if (error) {
            console.log('SQL error: ', error);
            reject(error);
          } else if (result.affectedRows > 0) {
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
