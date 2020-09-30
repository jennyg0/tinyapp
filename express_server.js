const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const {checkEmailExists } = require('./helpers')
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
var cookieParser = require('cookie-parser');
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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  //const user_id = 
  const templateVars = { user : users[req.cookies["user_id"]] , urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => { 
  const idShortURL = generateRandomString();
  urlDatabase[idShortURL] = req.body['longURL'];
  res.redirect(`/urls/${idShortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  //console.log(req.params);
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL", (req, res) => {
  const newURL = req.body.newURL;
  //console.log(newURL)
  urlDatabase[req.params.shortURL] = newURL;
  res.redirect('/urls');
});

app.post("/urls/:shortURL/delete", (req,res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user : users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user : users[req.cookies["user_id"]] , shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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

app.post("/login", (req, res) => {
  const user_id = req.body.user_id;
  res.cookie('user_id', user_id);
  res.redirect('/urls');
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