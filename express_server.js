const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const {checkEmailExists } = require('./helpers')
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
var cookieParser = require('cookie-parser');
const urlencoded = require("body-parser/lib/types/urlencoded");
app.use(cookieParser())

app.set("view engine", "ejs");

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

const users = { 
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
}

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    const templateVars = { user : users[req.cookies["user_id"]] , urls: urlDatabase };
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post("/urls", (req, res) => { 
  const idShortURL = generateRandomString();
  const longURL = req.body['longURL']
  const userID = req.cookies["user_id"];
  urlDatabase[idShortURL] = {longURL , userID };
  console.log(urlDatabase)
  res.redirect(`/urls/${idShortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  //console.log(req.params);
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const templateVars = { user : users[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:shortURL", (req, res) => {
    const templateVars = { user : users[req.cookies["user_id"]], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
    res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  const templateVars = { user : users[req.cookies["user_id"]] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user : users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const newURL = req.body.newURL;
  const shortURL = req.params.shortURL;
  const userID = req.cookies["user_id"];
  urlDatabase[shortURL] = {longURL: newURL, userID};
  res.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (req,res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const {email, password} = req.body;
  if (!(email) || !(password)) {
    console.log('didnt enter email or password')
    res.send('400');
  }
  //if email doesn't exist in users, 400 error
  if (!checkEmailExists(users, email)) {
    console.log('email doesnt exist, plz register');
    res.send('403'); //redirect to register maybe?
  } else { 
    //email exists in users, find user_id and login
    const user = checkEmailExists(users, email);
    if (users[user].password === password) {
      res.cookie('user_id', user);
      res.redirect('/urls');
    } else {
      console.log('password does not match email')
      res.send('403');
    }  
  }
});

app.post("/logout", (req, res) => {
  const user_id = req.body.user_id;
  res.clearCookie('user_id', user_id);
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  const {email, password} = req.body;
  if (!(email) || !(password)) {
    console.log('didnt enter email or password')
    res.send('400');
  }
  //if email already exists in users, 400 error
  if (checkEmailExists(users, email)) {
    console.log('email exists');
    res.send('400');
  } else { 
    //email doesnt exist in users, create new user key/value
    const id = generateRandomString();
    users[id] = {id, email, password};
    res.cookie('user_id', id);
    //console.log(users);
    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});