
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('./models/User');
const Blog = require('./models/Blog');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });

// Home route
app.get('/', (req, res) => {
    res.send('Welcome to BlogSpace Backend!');
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

        res.json({
            message: 'Login successful!',
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

// CREATE BLOG
app.post('/api/blogs', async (req, res) => {
    try {
        const { title, content, author, tag } = req.body;

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

        const newBlog = await Blog.create({
            title: title.trim(),
            content: content.trim(),
            author: author || 'BlogSpace User',
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
app.put('/api/blogs/:id', async (req, res) => {
    try {
        const { title, content, author, tag } = req.body;

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
            return res.status(404).json({
                message: 'Blog not found!'
            });
        }

        const updates = {
            title: title.trim(),
            content: content.trim()
        };

        if (typeof author === 'string') {
            updates.author = author;
        }

        if (typeof tag === 'string') {
            updates.tag = tag;
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedBlog) {
            return res.status(404).json({
                message: 'Blog not found!'
            });
        }

        res.json({
            message: 'Blog updated successfully!',
            blog: {
                id: updatedBlog._id,
                title: updatedBlog.title,
                content: updatedBlog.content,
                author: updatedBlog.author,
                tag: updatedBlog.tag,
                date: updatedBlog.date
            }
        });

    } catch (error) {
        console.error('Update blog error:', error);

        res.status(500).json({
            message: 'Could not update blog.'
        });
    }
});

// DELETE BLOG
app.delete('/api/blogs/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({
                message: 'Blog not found!'
            });
        }

        const deletedBlog = await Blog.findByIdAndDelete(
            req.params.id
        );

        if (!deletedBlog) {
            return res.status(404).json({
                message: 'Blog not found!'
            });
        }

        res.json({
            message: 'Blog deleted successfully!',
            blog: deletedBlog
        });

    } catch (error) {
        console.error('Delete blog error:', error);

        res.status(500).json({
            message: 'Could not delete blog.'
        });
    }
});

// START SERVER
app.listen(3000, () => {
    console.log('BlogSpace server is running on port 3000');
});
