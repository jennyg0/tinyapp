const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const { checkEmailExists, urlsForUser, urlCheck} = require('./helpers')
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
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    let userUrlDatabase = urlsForUser(urlDatabase, req.cookies["user_id"]);
    const templateVars = { user : users[req.cookies["user_id"]] , urls: userUrlDatabase };
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
  let shortUrl = req.params.shortURL;
  let user = req.cookies["user_id"];
  if (user && user === urlDatabase[shortUrl].userID) {
    const templateVars = { user : users[user], shortURL: shortUrl, longURL: urlDatabase[shortUrl].longURL };
    res.render("urls_show", templateVars);
  } else if (user && user !== urlDatabase[shortUrl].userID) {
      const templateVars = { user : users[user] };
      res.render('urls_404', templateVars);
  } else {
    res.redirect('/login');
  }
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
  const user = req.cookies["user_id"];
  if (user && user === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL] = {longURL: newURL, userID: user};
    res.redirect('/urls');
  } else {
    res.send('<h2>Error: You don\'t have permission to edit this url!</h2>')
  }
});

app.post("/urls/:shortURL/delete", (req,res) => {
  let shortUrl = req.params.shortURL;
  let user = req.cookies["user_id"];
  if (user && user === urlDatabase[shortUrl].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.send('<h2>Error: You don\'t have permission to delete this url!</h2>')
  }
});

app.post("/login", (req, res) => {
  const {email, password} = req.body;
  if (!(email) || !(password)) {
    console.log('didnt enter email or password')
    res.send('<h2>400: Did not enter email or password\n</h2>');
  }
  //if email doesn't exist in users, 400 error
  if (!checkEmailExists(users, email)) {
    res.send('<h2>403: Email does not exist, please register\n</h2>'); 
  } else { 
    //email exists in users, find user_id and login
    const user = checkEmailExists(users, email);
    if (users[user].password === password) {
      res.cookie('user_id', user);
      res.redirect('/urls');
    } else {
      console.log('password does not match email')
      res.send('<h2>403: Password does not match email, please login again.\n</h2>');
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

//if user goes to a page that doesn't exist - show 404 error
app.get('*', (req, res) => {
  const templateVars = { user : users[req.cookies["user_id"]] };
  res.render('urls_404', templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});