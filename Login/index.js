const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

const dbconnect = require('./dbconnect.js');
const UserModel = require('./user_schema.js');
const jwtSecret = process.env.JWT_SECRET || 'local-development-secret';

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
app.get(["/", "/login"], (req,res) => {
  res.send("Hello Login")
})

app.post(["/", "/login"], async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  try {
    const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      message: "Login successful",
      token: jwt.sign(
        { sub: user._id.toString(), email: user.email, role: user.role },
        jwtSecret,
        { expiresIn: "1h" }
      ),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Unable to login" });
  }
});

// START THE EXPRESS SERVER. 5000 is the PORT NUMBER
app.listen(5004, () => console.log('EXPRESS Server Started at Port No: 5004'));
