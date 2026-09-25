const express = require('express');
const mongoose = require('mongoose');
const app = express();

const port = 4555;


app.use(express.json());


const databaseConnection = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/techSchoolApp");
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Database connection failed", error);
  }
}

databaseConnection();


app.get("/", (req, res) => {
  res.send("Hello World");
});

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  age: Number,

  email: {
    type: String,
    required: true,
    unique: true
  },

  phone: String,

  address: String,

  course: {
    type: String,
    minlength: 2
  },

  institution: String
});

const Student = mongoose.model("Student", studentSchema);


app.post("/create-student", async (req, res) => {
  const { name, age, email, phone, address, course, institution } = req.body;

  try {
    const student = new Student({
      name,
      age,
      email,
      phone,
      address,
      course,
      institution
    });

    await student.save();

    return res.status(200).json({
      message: "Student created successfully",
      student
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        error: error.message
      });
    }

    return res.status(500).json({
      message: "Internal server error"
    });
  }
});


app.get("/get-students", async (req, res) => {
  try {
    const students = await Student.find();
    return res.status(200).json({ message: "Students fetched successfully", students });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}); 


app.get("/get-student/:id", async (req, res) => {
  const { id } = req.params;

  // isValid checks whether Mongoose can treat the value as an ObjectId.
  // It does not prove that a student with that ID exists.
  // It is also not a perfect strict-format check because some values can be
  // cast to ObjectIds even though they are not the usual 24-character hex string.
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid student ID"
    });
  }

  try {
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    return res.status(200).json({
      message: "Student fetched successfully",
      student
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

app.put("/update-student/:id", async (req, res) => {
  const { id } = req.params;
  const { name, age, email, phone, address, course, institution } = req.body;
  try {
    const student = await Student.findByIdAndUpdate(id, { name, age, email, phone, address, course, institution }, { new: true, runValidators: true });
    // new: true returns the updated document.
    // runValidators: true makes Mongoose apply schema validators during the update.
    return res.status(200).json({ message: "Student updated successfully", student });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/get-student-by-name', async (req, res) => {
  const { name } = req.query;
  try {
    const student = await Student.find({ name });
    return res.status(200).json({ message: "Student fetched successfully", student });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/search-students", async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.status(400).json({
      message: "Search query is required"
    });
  }

  try {
    const searchRegex = new RegExp(q.trim(), "i");

    const students = await Student.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { course: searchRegex }
      ]
    });

    return res.status(200).json({
      message: "Students searched successfully",
      students
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

app.patch("/students/:id/course", async (req, res) => {
 const { id } = req.params;
 const { course } = req.body || {};

  if (!course || course.trim() === "") {
    return res.status(400).json({
      message: "Course is required"
    });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid student ID"
    });
  }

  try {
    const student = await Student.findByIdAndUpdate(
      id,
      { course },
      {
        // new: true returns the updated student instead of the old document.
        // runValidators: true makes Mongoose run schema validation during the update.
        new: true,
        runValidators: true
      }
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    return res.status(200).json({
      message: "Course updated successfully",
      student
    });

  } catch (error) {

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Course validation failed",
        error: error.message
      });
    }

    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

app.delete("/delete-student/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "Invalid student ID"
    });
  }

  try {
    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }
    // 200 is used because the response includes a confirmation message in the response body.
    return res.status(200).json({
      message: "Student deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});