const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const bcrypt = require('bcrypt');
const urlencoded = require("body-parser/lib/types/urlencoded");
var cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}))
app.set("view engine", "ejs");

//importing helper functions
const { checkEmailExists, urlsForUser, urlCheck, generateRandomString} = require('./helpers')

//////////////DATABASES////////////////////

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
}

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user2RandomID" }
};

////////////GET///////////////////

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
  if (req.session['user_id']) {
    let userUrlDatabase = urlsForUser(urlDatabase, req.session['user_id']);
    const templateVars = { user : users[req.session['user_id']] , urls: userUrlDatabase };
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/u/:shortURL", (req, res) => {
  const user = req.session['user_id'];
  //display an error if the shortURL doesn't exist
  if(!urlDatabase[req.params.shortURL]) {
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
  //if there is no user, redirect to the login page
  if (!user) {
    res.redirect('/login');
  //check if the shortURL exists or if the userID of the url matches the user
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
  //show the register page
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user : users[req.session['user_id']] };
  //show the login page
  res.render("urls_login", templateVars);
});

////////////POST///////////////////

app.post("/urls", (req, res) => { 
  const idShortURL = generateRandomString();
  const longURL = req.body['longURL']
  const userID = req.session['user_id'];
  if (!longURL) {
    res.send("<h2>Didn't enter a URL. <a href='/urls/new' class='link'>Go Back</a>. </h2>")
  } else {
    urlDatabase[idShortURL] = {longURL , userID };
    res.redirect(`/urls/${idShortURL}`);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const newURL = req.body.newURL;
  const shortURL = req.params.shortURL;
  const user = req.session['user_id'];
  if (user && user === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL] = {longURL: newURL, userID: user};
    res.redirect('/urls');
  } else {
    res.send('<h2>Error: You don\'t have permission to edit this url!</h2>')
  }
});

app.post("/urls/:shortURL/delete", (req,res) => {
  const shortUrl = req.params.shortURL;
  const user = req.session['user_id'];
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
    res.send('<h2>400: Did not enter email and/or password\n</h2>');
  } //if email doesn't exist in users, 400 error
  if (!checkEmailExists(users, email)) {
    res.send('<h2>403: Email does not exist, please register\n</h2>'); 
  } else { 
    //email exists in users, find user_id and login
    const user = checkEmailExists(users, email);
    let passwordCheck = bcrypt.compareSync(password, users[user].password);
    if (passwordCheck) {
      req.session['user_id'] = user;
      res.redirect('/urls');
    } else {
      console.log('password does not match email')
      res.send('<h2>403: Password does not match email, please login again.\n</h2>');
    }  
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  const {email, password} = req.body;
  if (!(email) || !(password)) {
    console.log('didnt enter email or password')
    res.send('<h2>400: Did not enter email and/or password\n</h2>');
  } else if (checkEmailExists(users, email)) { //if email already exists in users, 400 error
    console.log('email exists');
    res.send('<h2>400: Email already exists, please login.\n</h2>');
  } else { //email doesnt exist in users, create new user key/value
    const id = generateRandomString();
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[id] = {id, email, password: hashedPassword};
    req.session['user_id'] = id;
    res.redirect('/urls');
  }
});

//if user goes to a page that doesn't exist - show 404 error
// app.get('*', (req, res) => {
//   const templateVars = { user : users[req.session['user_id']] };
//   res.render('urls_404', templateVars);
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});