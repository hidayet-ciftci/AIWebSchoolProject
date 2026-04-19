const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./src/models/User');
const Course = require('./src/models/Course');
async function run() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) { console.error('MONGO_URI not found'); return; }
    await mongoose.connect(mongoUri);
    const users = await User.find({}, 'email role').limit(5);
    console.log('--- First 5 Users ---');
    users.forEach(u => console.log('Email:', u.email, 'Role:', u.role));
    const courses = await Course.find({}).limit(5);
    console.log('\n--- First 5 Courses ---');
    courses.forEach(c => {
      console.log('ID:', c._id, 'Name:', c.name, 'Teacher:', c.teacher, 'Materials Count:', c.materials ? c.materials.length : 0);
    });
  } catch (err) { console.error(err); }
  finally { await mongoose.disconnect(); process.exit(0); }
}
run();
