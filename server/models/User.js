const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const LEGACY_ROLE_MAP = {
  faculty: 'admin'
};

const ACTIVE_ROLES = ['user', 'admin', 'principal'];

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ACTIVE_ROLES,
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.normalizeRole = function(role) {
  return LEGACY_ROLE_MAP[role] || role;
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  obj.role = this.constructor.normalizeRole(obj.role);
  return obj;
};

module.exports = mongoose.model('User', userSchema);
