const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));
app.set("view engine", "ejs");

//importing helper functions from file
const { checkEmailExists, urlsForUser, generateRandomString} = require('./helpers');

//DATABASES

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur",10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

//GET

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  if (req.session['user_id']) { //if logged in
    let userUrlDatabase = urlsForUser(urlDatabase, req.session['user_id']);
    const templateVars = { user : users[req.session['user_id']] , urls: userUrlDatabase };
    res.render("urls_index", templateVars);
  } else { //redirect to login page if not logged in
    res.redirect('/login');
  }
});

app.get("/u/:shortURL", (req, res) => {
  const user = req.session['user_id'];
  //display an error if the shortURL doesn't exist
  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = { user : users[user] };
    res.render('urls_404', templateVars);
  } else { //else the shortURL exists, go to the corresponding longURL
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = { user : users[req.session['user_id']] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const shortUrl = req.params.shortURL;
  const user = req.session['user_id'];
  // redirect to the login page if not logged in
  if (!user) {
    res.send("<h2>Please <a href='/login' class='link'>Login</a> to view this page.\n</h2>");
  //since logged in, check if the shortURL exists or if the userID of the url matches the user
  } else if (!urlDatabase[shortUrl] || (user && user !== urlDatabase[shortUrl].userID)) {
    const templateVars = { user : users[user] };
    res.render('urls_404', templateVars);
  //show the page if user and userID of the url match
  } else if (user && user === urlDatabase[shortUrl].userID) {
    const templateVars = { user : users[user], shortURL: shortUrl, longURL: urlDatabase[shortUrl].longURL };
    res.render("urls_show", templateVars);
  }
});

app.get("/register", (req, res) => {
  const templateVars = { user : users[req.session['user_id']] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user : users[req.session['user_id']] };
  res.render("urls_login", templateVars);
});

//POST

app.post("/urls", (req, res) => {
  const idShortURL = generateRandomString();
  const longURL = req.body['longURL'];
  const userID = req.session['user_id'];
  if (!longURL) { //if the user doesn't enter a url in the input
    res.send("<h2>Didn't enter a URL. <a href='/urls/new' class='link'>Go Back</a>. </h2>");
  } else {
    urlDatabase[idShortURL] = {longURL , userID };
    res.redirect(`/urls/${idShortURL}`);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const newURL = req.body.newURL;
  const shortURL = req.params.shortURL;
  const user = req.session['user_id'];
  if (user && user === urlDatabase[shortURL].userID) { //check if user logged in and matches the id of url
    urlDatabase[shortURL] = {longURL: newURL, userID: user};
    res.redirect('/urls');
  } else { //if the user doesn't match url give error
    res.send('<h2>Error: You don\'t have permission to edit this url!</h2>');
  }
});

app.post("/urls/:shortURL/delete", (req,res) => {
  const shortUrl = req.params.shortURL;
  const user = req.session['user_id'];
  if (user && user === urlDatabase[shortUrl].userID) { //check if user logged in and matches the id of url
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else { //if the user doesn't match url give error
    res.send('<h2>Error: You don\'t have permission to delete this url!</h2>');
  }
});

app.post("/login", (req, res) => {
  const {email, password} = req.body;
  if (!(email) || !(password)) {
    res.send("<h2>400: Did not enter email and/or password.<a href='/login' class='link'>Go Back</a>.\n</h2>");
  } //if email doesn't exist in users, 400 error
  if (!checkEmailExists(users, email)) {
    res.send("<h2>403: Email does not exist, please <a href='/register' class='link'>register</a>.\n</h2>");
  } else {
    //email exists in users, find user_id and login
    const user = checkEmailExists(users, email);
    let passwordCheck = bcrypt.compareSync(password, users[user].password);
    if (passwordCheck) {
      req.session['user_id'] = user;
      res.redirect('/urls');
    } else {
      res.send("<h2>403: Password does not match email, please <a href='/login' class='link'>login</a> again.\n</h2>");
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  const {email, password} = req.body;
  if (!(email) || !(password)) { //if the user leaves the email or password blank
    res.send('<h2>400: Did not enter email and/or password\n</h2>');
  } else if (checkEmailExists(users, email)) { //if email already exists in users, 400 error
    res.send("<h2>400: Email already exists, please <a href='/login' class='link'>login</a>.\n</h2>");
  } else { //email doesnt exist in users, create new user key/value
    const id = generateRandomString();
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[id] = {id, email, password: hashedPassword};
    req.session['user_id'] = id;
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});