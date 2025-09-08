const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Admin schema (matching the model structure)
const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  }
}, {
  timestamps: true
});

const Admin = mongoose.model('Admin', AdminSchema);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function questionHidden(query) {
  return new Promise(resolve => {
    process.stdout.write(query);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    let password = '';
    process.stdin.on('data', function(char) {
      char = char + '';

      switch(char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function setupAdmin() {
  try {
    console.log('🚀 NCompass Admin Setup');
    console.log('========================\n');

    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI not found in environment variables');
      console.log('Please create a .env.local file with your MongoDB connection string');
      process.exit(1);
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      console.log('⚠️  An admin user already exists in the database');
      const overwrite = await question('Do you want to create another admin user? (y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('Setup cancelled.');
        process.exit(0);
      }
    }

    // Get admin credentials
    console.log('Please enter the admin credentials:\n');

    const username = await question('Username (min 3 characters): ');
    if (!username || username.length < 3) {
      console.error('❌ Username must be at least 3 characters long');
      process.exit(1);
    }

    // Check if username already exists
    const existingUser = await Admin.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      console.error('❌ Username already exists. Please choose a different username.');
      process.exit(1);
    }

    const password = await questionHidden('Password (min 6 characters): ');
    if (!password || password.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    const confirmPassword = await questionHidden('Confirm password: ');
    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match');
      process.exit(1);
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await Admin.create({
      username: username.toLowerCase().trim(),
      password: hashedPassword
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📋 Admin Details:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Created: ${admin.createdAt}\n`);

    console.log('🎉 Setup complete! You can now:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Visit http://localhost:3000/admin');
    console.log('   3. Login with your admin credentials\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (error.code === 11000) {
      console.error('This username already exists. Please run the setup again with a different username.');
    }
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n👋 Setup cancelled by user');
  rl.close();
  await mongoose.disconnect();
  process.exit(0);
});

// Run setup
setupAdmin();