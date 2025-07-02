/**
 * Sanitizer Utility
 * Provides input sanitization and security functions
 */

class Sanitizer {
    
    /**
     * Sanitize text input to prevent XSS attacks
     * @param {string} text - The text to sanitize
     * @param {number} maxLength - Maximum allowed length
     * @returns {string} - Sanitized text
     */
    static sanitizeText(text, maxLength = 1000) {
        if (typeof text !== 'string') {
            return '';
        }
        
        // Remove potentially dangerous HTML/script tags
        const cleaned = text
            .trim()
            .slice(0, maxLength)
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
            .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
            .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/data:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        
        return cleaned;
    }
    
    /**
     * Sanitize HTML content more strictly
     * @param {string} html - The HTML to sanitize
     * @param {Array} allowedTags - Allowed HTML tags
     * @returns {string} - Sanitized HTML
     */
    static sanitizeHTML(html, allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br']) {
        if (typeof html !== 'string') {
            return '';
        }
        
        // Create a temporary element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Remove all elements except allowed ones
        const allElements = tempDiv.getElementsByTagName('*');
        for (let i = allElements.length - 1; i >= 0; i--) {
            const element = allElements[i];
            if (!allowedTags.includes(element.tagName.toLowerCase())) {
                element.parentNode.removeChild(element);
            } else {
                // Remove all attributes from allowed elements
                while (element.attributes.length > 0) {
                    element.removeAttribute(element.attributes[0].name);
                }
            }
        }
        
        return tempDiv.innerHTML;
    }
    
    /**
     * Sanitize location data
     * @param {Object} data - Location data object
     * @returns {Object} - Sanitized location data
     */
    static sanitizeLocationData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid location data');
        }
        
        return {
            name: this.sanitizeText(data.name, 100),
            address: this.sanitizeText(data.address, 200),
            city: this.sanitizeText(data.city, 50),
            state: this.sanitizeText(data.state, 50),
            notes: this.sanitizeText(data.notes, 500),
            category: this.sanitizeText(data.category, 50),
            lat: this.sanitizeNumber(data.lat, -90, 90),
            lng: this.sanitizeNumber(data.lng, -180, 180)
        };
    }
    
    /**
     * Sanitize user data
     * @param {Object} data - User data object
     * @returns {Object} - Sanitized user data
     */
    static sanitizeUserData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid user data');
        }
        
        return {
            firstName: this.sanitizeText(data.firstName, 50),
            lastName: this.sanitizeText(data.lastName, 50),
            email: this.sanitizeEmail(data.email),
            phone: this.sanitizePhone(data.phone),
            password: data.password // Don't sanitize passwords, just validate
        };
    }
    
    /**
     * Sanitize email address
     * @param {string} email - Email to sanitize
     * @returns {string} - Sanitized email
     */
    static sanitizeEmail(email) {
        if (typeof email !== 'string') {
            return '';
        }
        
        return email.toLowerCase().trim().slice(0, 254);
    }
    
    /**
     * Sanitize phone number
     * @param {string} phone - Phone number to sanitize
     * @returns {string} - Sanitized phone number
     */
    static sanitizePhone(phone) {
        if (typeof phone !== 'string') {
            return '';
        }
        
        // Remove all non-digit characters except + at the beginning
        return phone.replace(/[^\d+]/g, '').slice(0, 20);
    }
    
    /**
     * Sanitize numeric input
     * @param {*} value - Value to sanitize
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @returns {number} - Sanitized number
     */
    static sanitizeNumber(value, min = -Infinity, max = Infinity) {
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            throw new Error('Invalid number');
        }
        
        if (num < min || num > max) {
            throw new Error(`Number must be between ${min} and ${max}`);
        }
        
        return num;
    }
    
    /**
     * Sanitize URL
     * @param {string} url - URL to sanitize
     * @param {Array} allowedProtocols - Allowed URL protocols
     * @returns {string} - Sanitized URL
     */
    static sanitizeURL(url, allowedProtocols = ['http:', 'https:']) {
        if (typeof url !== 'string') {
            return '';
        }
        
        try {
            const urlObj = new URL(url);
            
            if (!allowedProtocols.includes(urlObj.protocol)) {
                throw new Error('Invalid protocol');
            }
            
            return urlObj.toString();
        } catch (error) {
            throw new Error('Invalid URL');
        }
    }
    
    /**
     * Sanitize filename
     * @param {string} filename - Filename to sanitize
     * @returns {string} - Sanitized filename
     */
    static sanitizeFilename(filename) {
        if (typeof filename !== 'string') {
            return '';
        }
        
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_{2,}/g, '_')
            .slice(0, 255);
    }
    
    /**
     * Validate and sanitize file type
     * @param {File} file - File object to validate
     * @param {Array} allowedTypes - Allowed MIME types
     * @param {number} maxSize - Maximum file size in bytes
     * @returns {boolean} - Whether file is valid
     */
    static validateFile(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) {
        if (!file || !(file instanceof File)) {
            throw new Error('Invalid file object');
        }
        
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        }
        
        if (file.size > maxSize) {
            throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
        }
        
        return true;
    }
    
    /**
     * Escape HTML entities
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    static escapeHTML(text) {
        if (typeof text !== 'string') {
            return '';
        }
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Remove null/undefined values from object
     * @param {Object} obj - Object to clean
     * @returns {Object} - Cleaned object
     */
    static removeNullValues(obj) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        
        const cleaned = {};
        
        for (const [key, value] of Object.entries(obj)) {
            if (value !== null && value !== undefined) {
                cleaned[key] = value;
            }
        }
        
        return cleaned;
    }
    
    /**
     * Deep clean object by sanitizing all string values
     * @param {Object} obj - Object to clean
     * @param {number} maxStringLength - Maximum length for strings
     * @returns {Object} - Cleaned object
     */
    static deepCleanObject(obj, maxStringLength = 1000) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        
        const cleaned = {};
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                cleaned[key] = this.sanitizeText(value, maxStringLength);
            } else if (typeof value === 'object' && value !== null) {
                cleaned[key] = this.deepCleanObject(value, maxStringLength);
            } else {
                cleaned[key] = value;
            }
        }
        
        return cleaned;
    }
}

// Export for global access
window.Sanitizer = Sanitizer;

console.log('✅ Sanitizer utility loaded');
