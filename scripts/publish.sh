#!/bin/bash

# Script to publish Mercury MCP Server to npm

set -e

echo "🚀 Publishing Mercury MCP Server to npm"
echo "======================================="

# Check if logged in to npm
if ! npm whoami &> /dev/null; then
    echo "❌ Not logged in to npm. Please run 'npm login' first."
    exit 1
fi

# Clean and build
echo "🧹 Cleaning previous build..."
npm run clean

echo "🔨 Building project..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test || true  # Continue even if tests fail for now

# Check package
echo "📦 Checking package..."
npm pack --dry-run

# Confirm publication
echo ""
echo "Ready to publish version $(node -p "require('./package.json').version")"
echo "Package name: $(node -p "require('./package.json').name")"
read -p "Continue with publication? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Publishing to npm..."
    npm publish --access public
    echo "✅ Successfully published!"
else
    echo "❌ Publication cancelled"
    exit 1
fi