const checkEmailExists = (db, email) => {
  for (const user in db) {
    if (db[user].email === email) {
      return db[user].id;
    } 
  }
  return null;
};

const urlsForUser = (db, id) => {
  const userUrls = {};
  for (const user in db) {
    let current = db[user];
    if (current.userID === id) {
      userUrls[user] = current;
    }
  }
  return userUrls;
};

const urlCheck = (db, userID, shortURL) => {
  let urls = urlsForUser(db, userID);
  for (let id in urls) {
    if (id === shortURL) {
      return true
    }
  }
  return false
}

module.exports = { checkEmailExists , urlsForUser , urlCheck};