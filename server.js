

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('Welcome to BlogSpace Backend!');
});

app.get('/api/status', (req, res) => {
    res.json({
        message: 'BlogSpace API is working!',
        status: 'success'
    });
});


const blogsFile = path.join(__dirname, 'blogs.json');
const usersFile = path.join(__dirname, 'users.json');

let users = [];

try {
    users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
} catch (error) {
    if (error.code !== 'ENOENT') {
        console.error('Error reading users.json:', error.message);
    }
}

function saveUsers() {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

let blogs = [];

try {
    blogs = JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
} catch (error) {
    console.error('Error reading blogs.json:', error.message);
}

function saveBlogs() {
    fs.writeFileSync(
        blogsFile,
        JSON.stringify(blogs, null, 2),
        'utf8'
    );
}


app.get('/api/blogs', (req, res) => {
    res.json(blogs);
});

app.use(express.json());

const bcrypt = require("bcryptjs");

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      typeof email !== "string" ||
      !/^\S+@\S+\.\S+$/.test(email.trim()) ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      return res.status(400).json({
        message: "Please provide a valid name, email, and password of at least 6 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = users.find(
      user => user.email === normalizedEmail
    );

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    };

    users.push(newUser);

    try {
      saveUsers();
    } catch (error) {
      users.pop();
      throw error;
    }

    return res.status(201).json({
      message: "Account created successfully!"
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "Could not create your account."
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = users.find(
      u => u.email === normalizedEmail
    );

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        message: "Email or password is incorrect."
      });
    }

    return res.json({
      message: "Login successful!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Could not log in. Please try again."
    });
  }
});



app.post('/api/blogs', (req, res) => {
    const { title, content } = req.body;

    if (
        typeof title !== 'string' ||
        title.trim().length < 3 ||
        typeof content !== 'string' ||
        content.trim().length < 20
    ) {
        return res.status(400).json({
            message: 'Title must be at least 3 characters and content at least 20 characters.'
        });
    }

    const newBlog = {
        id: Date.now(),
        title: req.body.title,
        content: req.body.content,
        author: req.body.author,
        tag: req.body.tag,
        date: req.body.date
    };

    blogs.push(newBlog);

    try {
        saveBlogs();

        res.status(201).json({
            message: 'Blog created successfully!',
            blog: newBlog
        });
    } catch (error) {
        blogs.pop();

        res.status(500).json({
            message: 'Could not save blog.'
        });
    }
});



app.put('/api/blogs/:id', (req, res) => {
    const id = Number(req.params.id);
    const blog = blogs.find(b => b.id === id);

    if (!blog) {
        return res.status(404).json({
            message: 'Blog not found!'
        });
    }

    const oldBlog = { ...blog };

    blog.title = req.body.title;
    blog.content = req.body.content;
    blog.author = req.body.author ?? blog.author;
    blog.tag = req.body.tag ?? blog.tag;
    blog.date = req.body.date ?? blog.date;

    try {
        saveBlogs();

        res.json({
            message: 'Blog updated successfully!',
            blog: blog
        });
    } catch (error) {
        Object.assign(blog, oldBlog);

        res.status(500).json({
            message: 'Could not save updated blog.'
        });
    }
});



app.delete('/api/blogs/:id', (req, res) => {
    const id = Number(req.params.id);
    const blogIndex = blogs.findIndex(b => b.id === id);

    if (blogIndex === -1) {
        return res.status(404).json({
            message: 'Blog not found!'
        });
    }

    const deletedBlog = blogs[blogIndex];

    blogs.splice(blogIndex, 1);

    try {
        saveBlogs();

        res.json({
            message: 'Blog deleted successfully!',
            blog: deletedBlog
        });
    } catch (error) {
        blogs.splice(blogIndex, 0, deletedBlog);

        res.status(500).json({
            message: 'Could not save deletion.'
        });
    }
});


app.listen(3000, () => {
    console.log('BlogSpace server is running on port 3000');
});
