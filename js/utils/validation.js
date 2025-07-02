/**
 * Validation Utilities
 * Common validation functions used across the application
 */

const ValidationUtils = {
    
    /**
     * Validate email address format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * Validate phone number (basic US format)
     */
    isValidPhone(phone) {
        // Basic US phone number validation (can be enhanced)
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    },
    
    /**
     * Check if string is not empty after trimming
     */
    isNotEmpty(value) {
        return value && value.trim().length > 0;
    },
    
    /**
     * Validate password strength
     */
    isValidPassword(password) {
        return password && password.length >= 6;
    },
    
    /**
     * Check if passwords match
     */
    passwordsMatch(password, confirmPassword) {
        return password === confirmPassword;
    },
    
    /**
     * Validate required form fields
     */
    validateRequired(fields) {
        for (const [name, value] of Object.entries(fields)) {
            if (!this.isNotEmpty(value)) {
                return { valid: false, field: name, message: `${name} is required` };
            }
        }
        return { valid: true };
    },
    
    /**
     * Validate registration form data
     */
    validateRegistration(formData) {
        const { firstName, lastName, email, phone, password, confirmPassword } = formData;
        
        // Check required fields
        const requiredCheck = this.validateRequired({
            'First Name': firstName,
            'Last Name': lastName,
            'Email': email,
            'Phone': phone,
            'Password': password,
            'Confirm Password': confirmPassword
        });
        
        if (!requiredCheck.valid) {
            return requiredCheck;
        }
        
        // Check email format
        if (!this.isValidEmail(email)) {
            return { valid: false, field: 'email', message: 'Please enter a valid email address' };
        }
        
        // Check phone format
        if (!this.isValidPhone(phone)) {
            return { valid: false, field: 'phone', message: 'Please enter a valid phone number' };
        }
        
        // Check password strength
        if (!this.isValidPassword(password)) {
            return { valid: false, field: 'password', message: 'Password must be at least 6 characters' };
        }
        
        // Check password match
        if (!this.passwordsMatch(password, confirmPassword)) {
            return { valid: false, field: 'confirmPassword', message: 'Passwords do not match' };
        }
        
        return { valid: true };
    },
    
    /**
     * Validate registration form data (alternative method)
     */
    validateRegistrationForm(userData) {
        const { firstName, lastName, email, phone, password, confirmPassword } = userData;
        
        // Check all required fields
        if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
            return {
                isValid: false,
                message: 'All fields are required'
            };
        }
        
        // Validate email format
        if (!this.isValidEmail(email)) {
            return {
                isValid: false,
                message: 'Please enter a valid email address'
            };
        }
        
        // Validate phone format
        if (!this.isValidPhone(phone)) {
            return {
                isValid: false,
                message: 'Please enter a valid phone number'
            };
        }
        
        // Validate password length
        if (password.length < 6) {
            return {
                isValid: false,
                message: 'Password must be at least 6 characters'
            };
        }
        
        // Check password confirmation
        if (password !== confirmPassword) {
            return {
                isValid: false,
                message: 'Passwords do not match'
            };
        }
        
        return {
            isValid: true,
            message: 'Validation passed'
        };
    }
};

// Export to global scope
window.ValidationUtils = ValidationUtils;

// Log module loading
if (window.Logger) {
    Logger.info('Validation utilities module loaded');
} else {
    console.log('✅ Validation utilities module loaded');
}
