//routing module 

const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../databases/database');
const {validatePassword, hashPassword, comparePassword, validateDisplayName} = require('./auth');
const loginTracker = require('./login-tracker');
const {checkLoginLockout, getClientIP} = require('./auth-middleware')
const crypto = require('crypto')//For generatinng a reset token
const {sendEmail} = require('./email')




  
//Gets for all of the pages

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/login', (req, res)=>{
  res.render('login');
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.get('/chat', (req, res) => {
  const messages = db.prepare(`SELECT * FROM chat_messages ORDER BY created_at`).all();
  res.render('chat', {messages});
});

router.get('/forgot-password', (req, res)=>{
  res.render('forgot-password');
});

//prepares the reset-password page 
router.get('/reset-password', (req, res)=>{
  const { token } = req.query;

  if (!token) {
    return res.redirect('/login?error=invalid-reset');
  }

  const user = db.prepare(`
    SELECT id
    FROM users
    WHERE password_reset_token = ?
      AND password_reset_expire > ?
  `).get(token, Date.now());

  if (!user) {
    return res.redirect('/login?error=expired-reset');
  }
  res.render('reset-password', {token});
});

//prepares the profile page 
router.get('/profile', (req, res) => {
  const user = db.prepare(
    `SELECT id, username, display_name, email FROM users WHERE id = ?
    `
  ).get(req.session.userId);

  res.render('profile', {user});
});

//gets comments from sql database and shows them on the webpage
router.get('/comments', (req, res)=> {
  //res.render('comments', {comments: comments});// comments:comments is passing the comments into view
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // comments per page
  const offset = (page - 1) * limit;

  // Get total count for pagination
  const totalComments = db.prepare('SELECT COUNT(*) as count FROM comments').get().count;
  const totalPages = Math.ceil(totalComments / limit);

  // Get paginated comments
  const comments = db.prepare(
    `SELECT comments.comment, comments.timestamp AS date, users.username, users.display_name, users.profile_color
    FROM comments
    LEFT JOIN users ON users.id = comments.userId
    ORDER BY comments.timestamp DESC
    LIMIT ? OFFSET ?`
  ).all(limit, offset);

  res.render('comments', {
    comments,
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  });
});

router.get('/comment/new', (req, res) => {
  if(req.session.userId){
    res.render('comment_new');
  }
  else{
    return res.render('login', {
      error: "You must be logged in to post a comment!",
    });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy(error => {
    if (error) {
      console.error('Error destroying session:', error);
      return res.status(500).send('Internal Server error')
    }
  console.log('User logged out');
  res.redirect('/');
  });
});

/*
 GET /me - Get current user info (requires authentication)
 */
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const user = db.prepare('SELECT id, username, created_at, last_login FROM users WHERE id = ?')
    .get(req.session.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ user });
});




//Posting comments 
router.post('/comments', (req, res) => {



  if(!req.session.userId){
    return res.render('login', {error:"You must be logged in to post a comment"});
  }
  //prepares a new comment 
  const insertComment = db.prepare(
    `INSERT INTO comments (userId, comment) VALUES (?, ?)`
  )
  //inserts the new comment into the comments table 
  insertComment.run(req.session.userId, req.body.comment);

  res.redirect('/comments?page=1'); // Shows newest comments
  });
  

//registering a new profile  
router.post('/register', async (req, res) => {

try{
  const {username, email, password, display_name, profileColor} = req.body;
    // Validate input
  if (!username || !password) {
    return res.render('register', {error: 'Must enter a username and password'});
    }

  // Validate password requirements
  const validation = validatePassword(password);
  if (!validation.valid) {
    //const errorsText = validation.errors.join(', ');
    return res.render('register', {
      error: "Password does not meet the requirements",
      errorList: validation.errors
    });
  }
  //check if username exists

  const existingUser = db.prepare(
    `SELECT * FROM users WHERE username = ?`
  ).get(username);


  if (existingUser) {
    return res.render('register', {
      error: "Username already exists. Please choose a different username.",
    });
  }
  //Check if display name works and meets requirements

  const validationDisplay = validateDisplayName(display_name);

  if(!validationDisplay.valid){
    return res.render('register', {error: "Display Name does not meet the requirements", errorList: validationDisplay.errors});
  } 
  //check to see if an existing displayname exists
  const existingDisplay = db.prepare(`SELECT * FROM users WHERE display_name = ?`).get(display_name);

  if(existingDisplay){
    return res.render('register', {error: "Display Name already exists. Please chooose a different display name.",})
  }
  // Hash the password before storing
  const passwordHash = await hashPassword(password);

  db.prepare(
    `INSERT INTO users (username, email, password, display_name, profile_color) 
    VALUES (?, ?, ?, ?, ?)`
  ).run(username, email, passwordHash, display_name, profileColor);
    res.redirect('/login');
}
  catch(error){
    console.error('Registration Error: ', error);
    res.render('register', {error: 'Internal server error'})

  }

});

//login

router.post('/login', checkLoginLockout, async (req, res) => {

  const {username, password} = req.body; //fasthand instead of listing out both
  const ipAddress = getClientIP(req)

  // const user = users.find(u => u.username === username && u.password === password);// finds users in the user aray

  const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);


  if (!user) {
    loginTracker.recordAttempt(ipAddress, username, false);
    return res.render('login', {
      error: "Username or Password is incorrect. Please try again."
    })
  }
  //compare the entered password with the stored hashed password

  const passwordMatch = await comparePassword(password, user.password);
  //make sure password matches

  if (!passwordMatch){
    loginTracker.recordAttempt(ipAddress, username, false);
    return res.render('login', {
      error: "Username or Password is incorrect. Please try again."
    })
  }
  //successful login
  loginTracker.recordAttempt(ipAddress, username, true);

  //update last login time
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  //This is where we create a session - super important
  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.displayName = user.display_name
  req.session.isLoggedIn = true;
  res.redirect('/comments');
});



router.post('/logout', (req, res) => {

  req.session.destroy(error => {
    if (error) {
      console.error('Error destroying sesssion', error);
      return res.status(500).send('Internal Server error')
    }
    res.redirect('/');
  });

});

//gets profile page info for the user
router.post('/profile', async (req, res) => {
  const username = req.session.username;
  const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
  if (!user){
    return res.redirect('login')
  }
  //for changing password and validating and all that
  if(req.body.newPassword){
    const currentPass = req.body.currentPassword;


    const comparedPassword = await comparePassword(currentPass, user.password);
    
    if(!comparedPassword){
      return res.render('profile', {
        error: "Must enter correct password to change to a new password",
        user
      });
    }
    
    const validatedPassword = validatePassword(req.body.newPassword);
    if (!validatedPassword.valid){
      return res.render('profile', {
        error: "Must enter a password that fulfills all requirements",
        errorList: validatedPassword.errors,
        user
      });
    }
    //hasing password
    const hashedPassword = await hashPassword(req.body.newPassword);
    db.prepare('UPDATE users SET password = ? WHERE username = ?')
      .run(hashedPassword, username);
    
    const updatedUser = db.prepare('SELECT id, username, display_name, email FROM users WHERE username = ?')
      .get(username);
    
    return res.render('profile', {
      success: "Password successfully updated", 
      user: updatedUser
    });
  }//changing email 
  else if(req.body.newEmail){
    const newEmail = req.body.newEmail;
    const currentPass = req.body.currentPasswordEmail;
    const comparedPassword = await comparePassword(currentPass, user.password);
    
    if(!comparedPassword){
      return res.render('profile', {
        error: "Must enter correct password to change to your email",
        user
      });
    }
    
    db.prepare('UPDATE users SET email = ? WHERE username = ?').run(newEmail, username);
    const updatedUser = db.prepare('SELECT id, username, display_name, profile_color, email FROM users WHERE username = ?').get(username);

    return res.render('profile', {
      success: "Email successfully updated",
      user: updatedUser
    });
  }
  else if (req.body.displayName){ //changing display name 
    const newDisplay = req.body.displayName;

    if(!newDisplay){
      return res.render('profile', {
        error: "Display name can't be empty",
        user
      });
    }
    const result = db.prepare(
      'UPDATE users SET display_name = ? WHERE id = ?').run(newDisplay, req.session.userId);


  // Safety check for debugging
  if (result.changes === 0) {
    return res.render('profile', {
      error: "Display name was not updated",
      user
    });
  }

    const updatedUser = db.prepare('SELECT id, username, display_name, profile_color, email FROM users WHERE id = ?').get(req.session.userId);
    return res.render('profile', {
      success: "Display name successfully updated",
      user: updatedUser
    });
  }

  //changing profile color 
  else if (req.body.profileColor){
    const newColor = req.body.profileColor;

    if(!newColor){
      return res.render('profile', {error: "Color can't be empty"}, user);
    }
    
    db.prepare('UPDATE users SET profile_color = ? WHERE id = ?').run(newColor, req.session.userId);

    const updatedUser = db.prepare('SELECT id, username, display_name, email, profile_color FROM users WHERE id = ? ').get(req.session.userId);
    return res.render('profile', {success: "Profile color was successfully updated", user: updatedUser});
  }
  
  res.redirect('/profile');
});

//how the user an change their password
router.post('/forgot-password', async(req,res)=>{
  //const username = req.session.username;
  const {email} = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  console.log(`Users email: ${email}`);


  if(!user){
    console.log(`Could not find user with email: ${email}`)
    return res.render('forgot-password', {success: 'If an account with that email exists, a password reset link will be sent shortly' })
  }

  const token = crypto.randomBytes(32).toString('hex');// generates a random token string for the password reset 
  const expires = Date.now() + 10 * 60 * 1000; // 1 hour

  db.prepare(`UPDATE users SET password_reset_token = ?, password_reset_expire = ? WHERE id = ?`).run(token, expires, user.id);

// Create the reset link
  const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
  console.log('About to send email to:', email); // Debug log
  console.log('Reset link:', resetLink); // Debug log
  // Send the email
  await sendEmail(
    email,
    'Password Reset Request',
    `Click this link to reset your password: ${resetLink}\n\nThis link expires in 1 hour.`
  );
  //console.log('Email send result:', result); // Debug log
  res.render('forgot-password', { success: 'If an account with that email exists, a password reset link will be sent shortly' });
});

//where the user actually resets their password - only possible through email link 
router.post('/reset-password', async (req, res)=> {
  const {token, password, confirmPassword} = req.body; // do them all at once
  if(!token){
    return res.render('login', {error: "No reset token available for this user"});
  }
  const user = db.prepare(`SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expire > ?`).get(token, Date.now());

  if(!user){
    return res.render('login', {error: "No reset token available for this user"});
  }

  // const newPassword = req.body.password;
  // const confirmPassword = req.body.confirmPassword;

  if (password !== confirmPassword){
    return res.render('reset-password', {error: "The passwords you entered do not match"});
  }

  const validation = validatePassword(password);
  if(!validation.valid){
    return res.render('reset-password',{error: "The password you entered must meet all requirements.", errorList: validation.errors});
  }
  const hashedPassword = await hashPassword(password);

  db.prepare(`UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expire = NULL WHERE id = ? `).run(hashedPassword, user.id);

  res.render('login', {success: "You have succesfully updated your password!"});


})


module.exports = router; 