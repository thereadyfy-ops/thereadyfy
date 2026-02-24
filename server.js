const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/The Readyfy-studio', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Create uploads directory if not exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Multer Configuration for File Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-password'
    }
});

// ============= SCHEMAS ============= //

// Contact Schema
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    company: String,
    service: String,
    message: String,
    date: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// Newsletter Schema
const newsletterSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    date: { type: Date, default: Date.now }
});

const Newsletter = mongoose.model('Newsletter', newsletterSchema);

// Project Schema
const projectSchema = new mongoose.Schema({
    title: String,
    category: String,
    description: String,
    image: String,
    date: Date,
    featured: { type: Boolean, default: false }
});

const Project = mongoose.model('Project', projectSchema);

// Blog Post Schema
const postSchema = new mongoose.Schema({
    title: String,
    category: String,
    content: String,
    image: String,
    author: String,
    date: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Team Member Schema
const teamSchema = new mongoose.Schema({
    name: String,
    role: String,
    image: String,
    bio: String,
    social: {
        instagram: String,
        linkedin: String,
        twitter: String
    }
});

const Team = mongoose.model('Team', teamSchema);

// ============= API ROUTES ============= //

// Contact Form Submission
app.post('/api/contact', async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();

        // Send Email
        await transporter.sendMail({
            from: 'your-email@gmail.com',
            to: 'thereadyfy@gmail.com',
            subject: 'New Contact Form Submission',
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${req.body.name}</p>
                <p><strong>Email:</strong> ${req.body.email}</p>
                <p><strong>Company:</strong> ${req.body.company || 'N/A'}</p>
                <p><strong>Service:</strong> ${req.body.service || 'N/A'}</p>
                <p><strong>Message:</strong> ${req.body.message}</p>
            `
        });

        res.status(201).json({ message: 'Contact saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Newsletter Subscription
app.post('/api/newsletter', async (req, res) => {
    try {
        const subscriber = new Newsletter(req.body);
        await subscriber.save();
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Projects
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find().sort({ date: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Single Project
app.get('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add New Project (Admin)
app.post('/api/projects', upload.single('image'), async (req, res) => {
    try {
        const projectData = {
            ...req.body,
            image: req.file ? `/uploads/${req.file.filename}` : null
        };
        const project = new Project(projectData);
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Blog Posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Single Post
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add New Post (Admin)
app.post('/api/posts', upload.single('image'), async (req, res) => {
    try {
        const postData = {
            ...req.body,
            image: req.file ? `/uploads/${req.file.filename}` : null
        };
        const post = new Post(postData);
        await post.save();
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Team Members
app.get('/api/team', async (req, res) => {
    try {
        const team = await Team.find();
        res.json(team);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add Team Member (Admin)
app.post('/api/team', upload.single('image'), async (req, res) => {
    try {
        const teamData = {
            ...req.body,
            image: req.file ? `/uploads/${req.file.filename}` : null,
            social: JSON.parse(req.body.social || '{}')
        };
        const member = new Team(teamData);
        await member.save();
        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Contact Submissions (Admin)
app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ date: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Newsletter Subscribers (Admin)
app.get('/api/newsletter', async (req, res) => {
    try {
        const subscribers = await Newsletter.find().sort({ date: -1 });
        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Contact (Admin)
app.delete('/api/contacts/:id', async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.json({ message: 'Contact deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Subscriber (Admin)
app.delete('/api/newsletter/:id', async (req, res) => {
    try {
        await Newsletter.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subscriber deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Project (Admin)
app.delete('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (project.image) {
            const imagePath = '.' + project.image;
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Post (Admin)
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.image) {
            const imagePath = '.' + post.image;
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Team Member (Admin)
app.delete('/api/team/:id', async (req, res) => {
    try {
        const member = await Team.findById(req.params.id);
        if (member.image) {
            const imagePath = '.' + member.image;
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        await Team.findByIdAndDelete(req.params.id);
        res.json({ message: 'Team member deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search API
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    try {
        const projects = await Project.find({ 
            title: { $regex: q, $options: 'i' } 
        });
        const posts = await Post.find({ 
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { content: { $regex: q, $options: 'i' } }
            ]
        });
        res.json({ projects, posts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Dashboard Stats (Admin)
app.get('/api/stats', async (req, res) => {
    try {
        const stats = {
            projects: await Project.countDocuments(),
            posts: await Post.countDocuments(),
            contacts: await Contact.countDocuments(),
            subscribers: await Newsletter.countDocuments(),
            team: await Team.countDocuments()
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});