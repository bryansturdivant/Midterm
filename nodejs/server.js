//Testing for cyberduck

// node server.js
//ssh -L 3000:localhost:3000 bsturdivant@143.198.9.242// In separate terminal while the server is running in another
//then: http://localhost:3000/Home.html in browser 


const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

//middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));


//allows me to serve all static files from the public directly 
app.use(express.static('public'));

//Routes


// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

//runs the app 
app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server is running on http://<143.198.9.242>:${PORT}`);
});
