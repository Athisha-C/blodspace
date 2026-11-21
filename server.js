
const express = require('express');
const path = require("path");
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('./models/User');
const Blog = require('./models/Blog');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'Access denied. Please log in.'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: 'Invalid or expired token.'
            });
        }

        req.user = user;
        next();
    });
}

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });

// Home route
// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API status
app.get('/api/status', (req, res) => {
    res.json({
        message: 'BlogSpace API is working!',
        status: 'success'
    });
});

// API status
app.get('/api/status', (req, res) => {
    res.json({
        message: 'BlogSpace API is working!',
        status: 'success'
    });
});

// REGISTER
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== 'string' ||
            name.trim().length < 2 ||
            typeof email !== 'string' ||
            !/^\S+@\S+\.\S+$/.test(email.trim()) ||
            typeof password !== 'string' ||
            password.length < 6
        ) {
            return res.status(400).json({
                message: 'Please provide a valid name, email, and password of at least 6 characters.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Email already registered.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        res.status(201).json({
            message: 'Registration successful!',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);

        res.status(500).json({
            message: 'Registration failed.'
        });
    }
});

// LOGIN

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (
            !user ||
            !(await bcrypt.compare(password, user.password))
        ) {
            return res.status(401).json({
                message: 'Email or password is incorrect.'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful!',
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        res.status(500).json({
            message: 'Could not log in. Please try again.'
        });
    }
});


// GET ALL BLOGS
app.get('/api/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ date: -1 });

        res.json(blogs.map(blog => ({
            id: blog._id,
            title: blog.title,
            content: blog.content,
            author: blog.author,
            tag: blog.tag,
            date: blog.date
        })));

    } catch (error) {
        console.error('Fetch blogs error:', error);

        res.status(500).json({
            message: 'Could not fetch blogs.'
        });
    }
});

// GET INDIVIDUAL BLOG
app.get('/api/blogs/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({
                message: 'Blog not found.'
            });
        }

        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                message: 'Blog not found.'
            });
        }

        res.json({
            id: blog._id,
            title: blog.title,
            content: blog.content,
            author: blog.author,
            tag: blog.tag,
            date: blog.date
        });

    } catch (error) {
        console.error('Blog details error:', error);

        res.status(500).json({
            message: 'Could not fetch blog.'
        });
    }
});


// GET LOGGED-IN USER'S BLOGS
app.get('/api/my-blogs', authenticateToken, async (req, res) => {
    try {
        const blogs = await Blog.find({
            user: req.user.userId
        }).sort({ date: -1 });

        res.json(blogs.map(blog => ({
            id: blog._id,
            title: blog.title,
            content: blog.content,
            author: blog.author,
            tag: blog.tag,
            date: blog.date
        })));

    } catch (error) {
        console.error('My blogs error:', error);

        res.status(500).json({
            message: 'Could not fetch your blogs.'
        });
    }
});

 // CREATE BLOG
app.post('/api/blogs', authenticateToken, async (req, res) => {
    try {
        const { title, content, tag } = req.body;

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

        // Find the logged-in user
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        // Create blog linked to the logged-in user
        const newBlog = await Blog.create({
            title: title.trim(),
            content: content.trim(),
            author: user.name,
            user: user._id,
            tag: tag || 'General'
        });

        res.status(201).json({
            message: 'Blog created successfully!',
            blog: newBlog
        });

    } catch (error) {
        console.error('Blog creation error:', error);

        res.status(500).json({
            message: 'Could not save blog.'
        });
    }
});


// UPDATE BLOG

// UPDATE BLOG - Only the owner can edit
app.put('/api/blogs/:id', authenticateToken, async (req, res) => {
    try {
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

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid blog ID.'
            });
        }

        const blog = await Blog.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!blog) {
            return res.status(404).json({
                message: 'Blog not found or you do not have permission to edit it.'
            });
        }

        blog.title = title.trim();
        blog.content = content.trim();

        await blog.save();

        res.json({
            message: 'Blog updated successfully!',
            blog
        });

    } catch (error) {
        console.error('Update blog error:', error);

        res.status(500).json({
            message: 'Could not update blog.'
        });
    }
});


// DELETE BLOG

// DELETE BLOG - Only the owner can delete
app.delete('/api/blogs/:id', authenticateToken, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid blog ID.'
            });
        }

        const blog = await Blog.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!blog) {
            return res.status(404).json({
                message: 'Blog not found or you do not have permission to delete it.'
            });
        }

        res.json({
            message: 'Blog deleted successfully!'
        });

    } catch (error) {
        console.error('Delete blog error:', error);

        res.status(500).json({
            message: 'Could not delete blog.'
        });
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

