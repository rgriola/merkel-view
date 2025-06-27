#!/usr/bin/env node

const fs = require('fs');

console.log('🔍 Validating Merkel View Configuration');
console.log('=====================================\n');

let hasErrors = false;

// Check if config.js exists
if (!fs.existsSync('config.js')) {
    console.log('❌ config.js not found');
    console.log('   Run: npm run setup');
    hasErrors = true;
} else {
    console.log('✅ config.js found');
    
    // Read and validate config
    try {
        const configContent = fs.readFileSync('config.js', 'utf8');
        
        // Check for placeholder values
        const placeholders = [
            'your-dev-api-key',
            'your-prod-api-key',
            'your-dev-project',
            'your-prod-project',
            'demo-api-key',
            'demo-project'
        ];
        
        const hasPlaceholders = placeholders.some(placeholder => 
            configContent.includes(placeholder)
        );
        
        if (hasPlaceholders) {
            console.log('⚠️  config.js contains placeholder values');
            console.log('   Run: npm run setup');
            hasErrors = true;
        } else {
            console.log('✅ config.js appears to be configured');
        }
        
    } catch (error) {
        console.log('❌ Error reading config.js:', error.message);
        hasErrors = true;
    }
}

// Check required files
const requiredFiles = [
    'index.html',
    'app.js',
    'style.css',
    'firebase-init.js',
    'maps-loader.js',
    'package.json'
];

console.log('\n📁 Checking required files:');
for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} missing`);
        hasErrors = true;
    }
}

// Check package.json dependencies
if (fs.existsSync('package.json')) {
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        console.log('\n📦 Checking dependencies:');
        
        const requiredDeps = ['firebase'];
        const requiredDevDeps = ['serve'];
        
        for (const dep of requiredDeps) {
            if (pkg.dependencies && pkg.dependencies[dep]) {
                console.log(`✅ ${dep} (${pkg.dependencies[dep]})`);
            } else {
                console.log(`❌ ${dep} missing from dependencies`);
                hasErrors = true;
            }
        }
        
        for (const dep of requiredDevDeps) {
            if (pkg.devDependencies && pkg.devDependencies[dep]) {
                console.log(`✅ ${dep} (dev) (${pkg.devDependencies[dep]})`);
            } else {
                console.log(`⚠️  ${dep} missing from devDependencies`);
            }
        }
        
    } catch (error) {
        console.log('❌ Error reading package.json:', error.message);
        hasErrors = true;
    }
}

// Summary
console.log('\n📋 Validation Summary:');
if (hasErrors) {
    console.log('❌ Configuration has issues that need to be resolved');
    console.log('\n🔧 To fix:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm run setup');
    console.log('3. Run: npm run validate-config');
    process.exit(1);
} else {
    console.log('✅ Configuration looks good!');
    console.log('\n🚀 Ready to run:');
    console.log('• Development: npm start');
    console.log('• Production: npm run deploy');
    process.exit(0);
}
