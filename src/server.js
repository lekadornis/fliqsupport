const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");

const mongoose = require("mongoose");

const app = express();
dotenv.config();

var corsOptions = {
    origin: "http://localhost:8081"
  };
  
app.use(cors(corsOptions));
  
app.use(bodyParser.json());
  
app.use(bodyParser.urlencoded({ extended: true }));
  
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });

//Internal routes
const indexRoute = require('./routes/home.route')
const adminRoute = require('./routes/admin.route')
const userRoute = require('./routes/user.route')

app.use('/', indexRoute);

app.use('/admin', adminRoute);
app.use('/profile', userRoute);

app.listen(3000, () => {
    console.log(`App is listening http://localhost:${ process.env.PORT }`);
});