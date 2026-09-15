const express = require('express');
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.json());

const dbconnect = require('./dbconnect.js');
const UserModel = require('./user_schema.js');

/*
In the postman use the following URL
localhost:5000/reg

{
  "firstname":"Joe",
  "email":"a@gmail.com",
  "password":"abc",
  "mobile": 12345678,
  "role": "student"
}

*/
//REG API
app.get(["/", "/reg"], (req,res) => {
  res.send("Hello Register")
})

app.post(["/", "/reg"], async (req, res) => {
  const { firstname, name, email, password, mobile, phone, role } = req.body;

  if (!email || !password || (!firstname && !name)) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const user = await UserModel.create({
      name: name || firstname,
      email: normalizedEmail,
      password,
      phone: phone || mobile,
      role
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    console.error("Registration failed:", error);
    return res.status(500).json({ message: "Unable to register user" });
  }
});

// START THE EXPRESS SERVER. 5000 is the PORT NUMBER
app.listen(5003, () => console.log('EXPRESS Server Started at Port No: 5003'));
