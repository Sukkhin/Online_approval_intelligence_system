const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const slaRoutes = require('./routes/sla');
const { checkSlaDeadlines } = require('./routes/sla');

const app = express();
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
const uploadsDir = process.env.UPLOADS_DIR
    ? (path.isAbsolute(process.env.UPLOADS_DIR)
        ? process.env.UPLOADS_DIR
        : path.join(__dirname, process.env.UPLOADS_DIR))
    : path.join(__dirname, 'uploads');
const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const clientDistDir = path.join(__dirname, '..', 'client', 'dist');

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    }
}));
app.use(express.json());

app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sla', slaRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

if (fs.existsSync(clientDistDir)) {
    app.use(express.static(clientDistDir));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }

        return res.sendFile(path.join(clientDistDir, 'index.html'));
    });
}

async function ensureBootstrapUser() {
    const name = process.env.BOOTSTRAP_USER_NAME?.trim();
    const email = process.env.BOOTSTRAP_USER_EMAIL?.trim().toLowerCase();
    const password = process.env.BOOTSTRAP_USER_PASSWORD;
    const role = User.normalizeRole(process.env.BOOTSTRAP_USER_ROLE?.trim() || 'principal');
    const allowedRoles = ['admin', 'principal'];

    if (!name && !email && !password) {
        return;
    }

    if (!name || !email || !password) {
        throw new Error('BOOTSTRAP_USER_NAME, BOOTSTRAP_USER_EMAIL, and BOOTSTRAP_USER_PASSWORD must all be set together');
    }

    if (!allowedRoles.includes(role)) {
        throw new Error(`BOOTSTRAP_USER_ROLE must be one of: ${allowedRoles.join(', ')}`);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        console.log(`Bootstrap user already exists for ${email}`);
        return;
    }

    const bootstrapUser = new User({ name, email, password, role });
    await bootstrapUser.save();
    console.log(`Bootstrap ${role} user created for ${email}`);
}

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        await ensureBootstrapUser();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);

            setInterval(checkSlaDeadlines, 30 * 60 * 1000);
            setTimeout(checkSlaDeadlines, 5000);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });
