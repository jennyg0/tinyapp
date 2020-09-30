const checkEmailExists = (db, email) => {
  for (const user in db) {
    if (db[user].email === email) {
      return db[user].id;
    } 
    return null;
  }
};


module.exports = { checkEmailExists };