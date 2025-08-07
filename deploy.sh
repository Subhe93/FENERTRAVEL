#!/bin/bash

# Fener Travel Deployment Script
# Usage: ./deploy.sh [production|development]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment is provided
ENVIRONMENT=${1:-production}

log_info "Starting deployment for ${ENVIRONMENT} environment..."

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed. Aborting."; exit 1; }
command -v yarn >/dev/null 2>&1 || { log_error "Yarn is required but not installed. Aborting."; exit 1; }
command -v pm2 >/dev/null 2>&1 || { log_error "PM2 is required but not installed. Run: npm install -g pm2"; exit 1; }

# Check if .env file exists
if [ ! -f .env ]; then
    log_warning ".env file not found. Creating from template..."
    cat > .env << EOF
NODE_ENV=${ENVIRONMENT}
PORT=5030
DATABASE_URL="postgresql://fenertravel_user:your_secure_password_here@localhost:5432/fenertravel_db"
JWT_SECRET=your_very_secure_jwt_secret_key_here
CORS_ORIGIN=http://localhost:5030,https://your-domain.com
EOF
    log_warning "Please update the .env file with your actual values before continuing."
    exit 1
fi

# Install dependencies
log_info "Installing dependencies..."
yarn install

# Generate Prisma client
log_info "Generating Prisma client..."
npx prisma generate

# Build the project
log_info "Building the project..."
yarn build

# Database setup
log_info "Setting up database..."
if [ "$ENVIRONMENT" = "production" ]; then
    npx prisma db push
else
    npx prisma migrate dev
fi

# Seed database (optional)
read -p "Do you want to seed the database with initial data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Seeding database..."
    yarn db:seed
fi

# PM2 setup
log_info "Setting up PM2..."

# Stop existing process if running
if pm2 list | grep -q "fenertravel"; then
    log_info "Stopping existing application..."
    pm2 stop fenertravel
    pm2 delete fenertravel
fi

# Start the application
log_info "Starting application with PM2..."
pm2 start ecosystem.config.js --env ${ENVIRONMENT}

# Save PM2 configuration
pm2 save

# Setup PM2 startup (only on first deployment)
if ! systemctl is-enabled pm2-$USER >/dev/null 2>&1; then
    log_info "Setting up PM2 startup..."
    pm2 startup
    log_warning "Please run the command shown above to complete PM2 startup setup."
fi

# Health check
log_info "Performing health check..."
sleep 5

if curl -f http://localhost:5030/health >/dev/null 2>&1; then
    log_success "Application is running successfully!"
    log_info "Application URL: http://localhost:5030"
    log_info "PM2 Status: pm2 status"
    log_info "PM2 Logs: pm2 logs fenertravel"
else
    log_error "Health check failed. Check PM2 logs: pm2 logs fenertravel"
    exit 1
fi

# Display useful information
echo
log_success "Deployment completed successfully!"
echo
echo "Useful commands:"
echo "  pm2 status           - Check application status"
echo "  pm2 logs fenertravel - View application logs"
echo "  pm2 restart fenertravel - Restart application"
echo "  pm2 stop fenertravel - Stop application"
echo "  pm2 monit           - Monitor resources"
echo

# Show current status
pm2 status 