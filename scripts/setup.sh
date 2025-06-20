#!/bin/bash

# Musical Theatre Hub Dev Environment Setup Script

# Skip colors for cross-platform compatibility
GREEN=""
YELLOW=""
RED=""
NC=""

echo "Setting up development environment for Musical Theatre Hub..."

# Check for package.json
if [ ! -f "../package.json" ]; then
  echo "Error: package.json not found!"
  echo "Make sure you are running this script from the scripts directory."
  echo "If package.json is still missing, you may need to create it manually."
  exit 1
fi

# Install Node.js dependencies
echo "Installing npm dependencies..."
npm install --prefix ..

# Check for .env.local file
if [ ! -f "../.env.local" ]; then
  echo "Warning: .env.local file not found."
  echo "Creating a template .env.local file..."
  cp ../.env.local.example ../.env.local 2>/dev/null || echo "No .env.local.example found. You'll need to manually create .env.local with proper credentials."
fi

# Check Supabase CLI installation
if ! command -v supabase &> /dev/null; then
  echo "Supabase CLI not found. It's recommended to install it for local development."
  echo "To install: npm install -g supabase"
fi

# Check for local Supabase setup
if [ -d "../supabase" ]; then
  echo "Setting up Supabase local development..."
  # Initialize Supabase if not already initialized
  if [ ! -d "../.supabase" ]; then
    echo "Initializing Supabase local development..."
    cd .. && npx supabase init
  fi
fi

# Build the project
echo "Building the project..."
cd .. && npm run build

echo "Setup complete! You can start the development server with:"
echo "npm run dev"
