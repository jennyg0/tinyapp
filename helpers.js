//check to see if the email already exists in the user database
const checkEmailExists = (db, email) => {
  for (const user in db) {
    if (db[user].email === email) {
      return db[user].id;
    }
  }
  return null;
};

//return the urls associated with the given userID
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

//generate a random string
const generateRandomString = function() {
  return Math.random().toString(36).substring(2,8);
};

module.exports = { checkEmailExists , urlsForUser , generateRandomString};