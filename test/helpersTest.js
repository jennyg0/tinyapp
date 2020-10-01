const { assert } = require('chai');

const { checkEmailExists } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('checkEmailExists', function() {
  it('should return a user with valid email', function() {
    const user = checkEmailExists(testUsers, "user@example.com");
    const expectedOutput = "userRandomID";
    assert.strictEqual(expectedOutput, user);
  });
  it('should return null with invalid email', function() {
    const user = checkEmailExists(testUsers, "user4@example.com");
    const expectedOutput = null;
    assert.strictEqual(expectedOutput, user);
  });
});