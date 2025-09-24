// controllers/authController.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Employee = require("../models/Employee");

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

exports.adminRegister = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }
    const admin = new Admin({ email, password });
    await admin.save();
    res.status(201).json({ message: "Admin created successfully", email });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Server error while creating admin" });
  }
  /*
    CURL for create admin in database
    curl -X POST https://backend-6bli.onrender.com/admin/register \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@gmail.com","password":"admin"}'
*/
};
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const admin = await Admin.findOne({ email });
    console.log(admin);
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(admin._id, "admin");
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during admin login" });
  }
};

exports.employeeLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const employee = await Employee.findOne({ email });
    if (!employee || !(await employee.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(employee._id, "employee");
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during employee login" });
  }
};
