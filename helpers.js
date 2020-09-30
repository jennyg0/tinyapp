const checkEmailExists = (db, email) => {
  for (const user in db) {
    if (db[user].email === email) {
      //console.log(users);
      //res.send('400');
      return true;
    } 
    return null;
  }
};

module.exports = { checkEmailExists };