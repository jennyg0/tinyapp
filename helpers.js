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

module.exports = { checkEmailExists , urlsForUser };