const mongoose = require('mongoose');

const recruiterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    company: { type: String, required: [true, 'Company name is required'], trim: true },
    designation: { type: String, trim: true, default: 'Recruiter' },
    website: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    industry: { type: String, trim: true, default: '' },
    about: { type: String, trim: true, default: '' },
    companySize: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recruiter', recruiterSchema);
