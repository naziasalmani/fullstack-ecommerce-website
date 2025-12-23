#!/bin/bash

# Maharashtra Nature Park Nursery - Backend Setup Script
# This script automates the setup process for the backend

echo "🌱 Setting up Maharashtra Nature Park Nursery Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Node.js is installed
print_step "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16 or later from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or later is required. Current version: $(node --version)"
    exit 1
fi

print_status "Node.js $(node --version) is installed ✓"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_status "npm $(npm --version) is installed ✓"

# Create project directory structure
print_step "Creating project directory structure..."
mkdir -p plant-nursery-backend/{config,models,routes,middleware,utils,data,tests,logs}

# Create directories
dirs=("config" "models" "routes" "middleware" "utils" "data" "tests" "logs")
for dir in "${dirs[@]}"; do
    if [ ! -d "plant-nursery-backend/$dir" ]; then
        mkdir -p "plant-nursery-backend/$dir"
        print_status "Created directory: $dir ✓"
    fi
done

# Navigate to project directory
cd plant-nursery-backend

# Initialize npm project if package.json doesn't exist
if [ ! -f "package.json" ]; then
    print_step "Initializing npm project..."
    npm init -y > /dev/null 2>&1
    print_status "npm project initialized ✓"
fi

# Install dependencies
print_step "Installing dependencies..."
npm install express cors bcryptjs jsonwebtoken uuid express-rate-limit helmet express-validator dotenv compression morgan --save

# Install dev dependencies
npm install nodemon jest supertest eslint eslint-config-standard eslint-plugin-import eslint-plugin-node eslint-plugin-promise --save-dev

print_status "Dependencies installed ✓"

# Create .env file from .env.example
print_step "Setting up environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status ".env file created from .env.example ✓"
        print_warning "Please update the .env file with your configuration values"
    else
        print_warning ".env.example not found. Please create .env file manually"
    fi
fi

# Create basic .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    print_step "Creating .gitignore file..."
    cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory
coverage/
*.lcov

# ESLint cache
.eslintcache

# Optional npm cache directory
.npm

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build
dist/
build/
EOF
    print_status ".gitignore created ✓"
fi

# Create basic ESLint configuration
if [ ! -f ".eslintrc.js" ]; then
    print_step "Creating ESLint configuration..."
    cat > .eslintrc.js << EOF
module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es6: true,
    node: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}
EOF
    print_status "ESLint configuration created ✓"
fi

# Create logs directory
mkdir -p logs
touch logs/.gitkeep

# Update package.json scripts
print_step "Updating package.json scripts..."
npm pkg set scripts.start="node server.js"
npm pkg set scripts.dev="nodemon server.js"
npm pkg set scripts.test="jest"
npm pkg set scripts.test:watch="jest --watch"
npm pkg set scripts.lint="eslint ."
npm pkg set scripts.lint:fix="eslint . --fix"

print_status "Package.json scripts updated ✓"

# Check if all required files exist
print_step "Checking required files..."
required_files=("server.js" "package.json" "data/plants.js" "utils/helpers.js")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    print_status "All required files are present ✓"
else
    print_warning "Missing files detected:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    print_warning "Please create the missing files before running the server"
fi

# Final setup steps
print_step "Final setup steps..."

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Review and update the .env file with your configuration"
echo "2. Make sure all required files are created (server.js, data/plants.js, utils/helpers.js)"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit http://localhost:3000/api/health to verify the setup"
echo ""
echo "Available scripts:"
echo "  npm start     - Start production server"
echo "  npm run dev   - Start development server with hot reload"
echo "  npm test      - Run tests"
echo "  npm run lint  - Run ESLint"
echo ""
print_status "Happy coding! 🚀"