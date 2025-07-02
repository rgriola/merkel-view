/**
 * Error Handler Utility
 * Provides centralized error handling and retry logic
 */

class ErrorHandler {
    
    /**
     * Retry a function with exponential backoff
     * @param {Function} fn - The function to retry
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} delay - Initial delay in milliseconds
     * @returns {Promise} - The result of the function
     */
    static async withRetry(fn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                console.warn(`⚠️ Attempt ${i + 1} failed:`, error.message);
                
                if (i === maxRetries - 1) {
                    console.error(`❌ All ${maxRetries} attempts failed`);
                    throw error;
                }
                
                // Exponential backoff
                const waitTime = delay * Math.pow(2, i);
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    
    /**
     * Handle Firebase-specific errors with user-friendly messages
     * @param {Error} error - The Firebase error
     * @param {string} context - Context where the error occurred
     * @returns {string} - User-friendly error message
     */
    static handleFirebaseError(error, context = 'Firebase operation') {
        const userFriendlyMessages = {
            // Firestore errors
            'permission-denied': 'You don\'t have permission to perform this action. Please sign in again.',
            'unavailable': 'Service temporarily unavailable. Please try again in a moment.',
            'deadline-exceeded': 'Request timed out. Please check your internet connection.',
            'failed-precondition': 'Database not properly configured. Please contact support.',
            'not-found': 'The requested data was not found.',
            'already-exists': 'This item already exists.',
            'resource-exhausted': 'Too many requests. Please try again later.',
            'cancelled': 'Operation was cancelled.',
            'data-loss': 'Data corruption detected. Please try again.',
            'unknown': 'An unknown error occurred. Please try again.',
            'invalid-argument': 'Invalid data provided. Please check your input.',
            'out-of-range': 'Value is out of acceptable range.',
            'unauthenticated': 'Please sign in to continue.',
            'aborted': 'Operation was aborted due to a conflict. Please try again.',
            
            // Auth errors
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-login-credentials': 'Invalid login credentials. Please check your email and password.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled. Please contact support.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/api-key-not-valid': 'API key not valid. Please contact support.',
            'auth/network-request-failed': 'Network error. Please check your internet connection.',
            
            // Storage errors
            'storage/object-not-found': 'File not found.',
            'storage/unauthorized': 'Not authorized to access this file.',
            'storage/canceled': 'File upload was cancelled.',
            'storage/unknown': 'Unknown storage error occurred.',
            'storage/invalid-format': 'Invalid file format.',
            'storage/invalid-event-name': 'Invalid upload event.',
            'storage/invalid-url': 'Invalid file URL.',
            'storage/invalid-argument': 'Invalid storage argument.',
            'storage/no-default-bucket': 'No default storage bucket configured.',
            'storage/cannot-slice-blob': 'File processing error.',
            'storage/server-file-wrong-size': 'File size mismatch.',
            'storage/quota-exceeded': 'Storage quota exceeded.'
        };
        
        console.error(`❌ [${context}] Firebase error:`, {
            code: error.code,
            message: error.message,
            stack: error.stack
        });
        
        return userFriendlyMessages[error.code] || 
               error.message || 
               'An unexpected error occurred. Please try again.';
    }
    
    /**
     * Handle network errors
     * @param {Error} error - The network error
     * @param {string} context - Context where the error occurred
     * @returns {string} - User-friendly error message
     */
    static handleNetworkError(error, context = 'Network operation') {
        console.error(`❌ [${context}] Network error:`, error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return 'Network connection failed. Please check your internet connection.';
        }
        
        if (error.code === 'NETWORK_ERROR' || error.message.includes('network')) {
            return 'Network error occurred. Please try again.';
        }
        
        return 'Connection error. Please check your internet connection and try again.';
    }
    
    /**
     * Wrap async operations with error handling
     * @param {Function} operation - The async operation to wrap
     * @param {string} context - Context for error logging
     * @param {boolean} showToUser - Whether to show error to user
     * @returns {Promise} - Wrapped operation result
     */
    static async wrapAsync(operation, context = 'Operation', showToUser = true) {
        try {
            return await operation();
        } catch (error) {
            let userMessage;
            
            if (error.code && error.code.startsWith('auth/')) {
                userMessage = this.handleFirebaseError(error, context);
            } else if (error.code && (error.code.includes('firestore') || error.code.includes('storage'))) {
                userMessage = this.handleFirebaseError(error, context);
            } else if (error.name === 'TypeError' || error.message.includes('network')) {
                userMessage = this.handleNetworkError(error, context);
            } else {
                console.error(`❌ [${context}] Unexpected error:`, error);
                userMessage = error.message || 'An unexpected error occurred.';
            }
            
            if (showToUser && window.UIFeedback) {
                window.UIFeedback.showToast(userMessage, 'error');
            }
            
            throw new Error(userMessage);
        }
    }
    
    /**
     * Validate required fields
     * @param {Object} data - The data object to validate
     * @param {string[]} requiredFields - Array of required field names
     * @param {string} context - Context for error messages
     * @throws {Error} - If validation fails
     */
    static validateRequired(data, requiredFields, context = 'Data validation') {
        const missing = requiredFields.filter(field => {
            const value = data[field];
            return value === null || value === undefined || 
                   (typeof value === 'string' && value.trim() === '');
        });
        
        if (missing.length > 0) {
            const message = `Missing required fields: ${missing.join(', ')}`;
            console.error(`❌ [${context}] Validation error:`, message);
            throw new Error(message);
        }
    }
    
    /**
     * Create a safe async handler for event listeners
     * @param {Function} handler - The event handler function
     * @param {string} context - Context for error logging
     * @returns {Function} - Wrapped event handler
     */
    static safeEventHandler(handler, context = 'Event handler') {
        return async function(...args) {
            try {
                return await handler.apply(this, args);
            } catch (error) {
                console.error(`❌ [${context}] Event handler error:`, error);
                
                if (window.UIFeedback) {
                    window.UIFeedback.showToast(
                        'An error occurred while processing your request.',
                        'error'
                    );
                }
            }
        };
    }
}

// Export for global access
window.ErrorHandler = ErrorHandler;

console.log('✅ Error handler utility loaded');
