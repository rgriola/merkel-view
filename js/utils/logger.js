/**
 * Logger Utility
 * Provides consistent logging across the application
 */

class Logger {
    static levels = { 
        ERROR: 0, 
        WARN: 1, 
        INFO: 2, 
        DEBUG: 3 
    };
    
    static currentLevel = Logger.levels.INFO;
    static logHistory = [];
    static maxHistorySize = 1000;
    
    /**
     * Set the logging level
     * @param {string} level - The logging level (ERROR, WARN, INFO, DEBUG)
     */
    static setLevel(level) {
        if (this.levels[level] !== undefined) {
            this.currentLevel = this.levels[level];
            console.log(`📋 Logger level set to: ${level}`);
        } else {
            console.warn(`⚠️ Invalid log level: ${level}`);
        }
    }
    
    /**
     * Log an error message
     * @param {string} module - The module name
     * @param {string} message - The log message
     * @param {*} data - Additional data to log
     */
    static error(module, message, data = null) {
        if (this.currentLevel >= this.levels.ERROR) {
            const logEntry = this._createLogEntry('ERROR', module, message, data);
            console.error(`❌ [${module}] ${message}`, data || '');
            this._addToHistory(logEntry);
        }
    }
    
    /**
     * Log a warning message
     * @param {string} module - The module name
     * @param {string} message - The log message
     * @param {*} data - Additional data to log
     */
    static warn(module, message, data = null) {
        if (this.currentLevel >= this.levels.WARN) {
            const logEntry = this._createLogEntry('WARN', module, message, data);
            console.warn(`⚠️ [${module}] ${message}`, data || '');
            this._addToHistory(logEntry);
        }
    }
    
    /**
     * Log an info message
     * @param {string} module - The module name
     * @param {string} message - The log message
     * @param {*} data - Additional data to log
     */
    static info(module, message, data = null) {
        if (this.currentLevel >= this.levels.INFO) {
            const logEntry = this._createLogEntry('INFO', module, message, data);
            console.log(`ℹ️ [${module}] ${message}`, data || '');
            this._addToHistory(logEntry);
        }
    }
    
    /**
     * Log a debug message
     * @param {string} module - The module name
     * @param {string} message - The log message
     * @param {*} data - Additional data to log
     */
    static debug(module, message, data = null) {
        if (this.currentLevel >= this.levels.DEBUG) {
            const logEntry = this._createLogEntry('DEBUG', module, message, data);
            console.debug(`🔍 [${module}] ${message}`, data || '');
            this._addToHistory(logEntry);
        }
    }
    
    /**
     * Log a success message (always shows as info level)
     * @param {string} module - The module name
     * @param {string} message - The log message
     * @param {*} data - Additional data to log
     */
    static success(module, message, data = null) {
        if (this.currentLevel >= this.levels.INFO) {
            const logEntry = this._createLogEntry('SUCCESS', module, message, data);
            console.log(`✅ [${module}] ${message}`, data || '');
            this._addToHistory(logEntry);
        }
    }
    
    /**
     * Start a performance timer
     * @param {string} label - Timer label
     */
    static startTimer(label) {
        console.time(`⏱️ ${label}`);
    }
    
    /**
     * End a performance timer
     * @param {string} label - Timer label
     */
    static endTimer(label) {
        console.timeEnd(`⏱️ ${label}`);
    }
    
    /**
     * Log with performance measurement
     * @param {string} module - The module name
     * @param {string} operation - The operation name
     * @param {Function} fn - The function to measure
     * @returns {*} - The result of the function
     */
    static async measurePerformance(module, operation, fn) {
        const start = performance.now();
        const timerLabel = `${module}::${operation}`;
        
        this.startTimer(timerLabel);
        
        try {
            const result = await fn();
            const end = performance.now();
            const duration = (end - start).toFixed(2);
            
            this.info(module, `${operation} completed in ${duration}ms`);
            this.endTimer(timerLabel);
            
            return result;
        } catch (error) {
            const end = performance.now();
            const duration = (end - start).toFixed(2);
            
            this.error(module, `${operation} failed after ${duration}ms`, error);
            this.endTimer(timerLabel);
            
            throw error;
        }
    }
    
    /**
     * Get log history
     * @param {string} level - Optional level filter
     * @param {number} limit - Optional limit of entries
     * @returns {Array} - Log entries
     */
    static getHistory(level = null, limit = 100) {
        let logs = this.logHistory;
        
        if (level) {
            logs = logs.filter(entry => entry.level === level);
        }
        
        return logs.slice(-limit);
    }
    
    /**
     * Clear log history
     */
    static clearHistory() {
        this.logHistory = [];
        console.log('📋 Log history cleared');
    }
    
    /**
     * Export logs as JSON string
     * @returns {string} - JSON string of logs
     */
    static exportLogs() {
        return JSON.stringify(this.logHistory, null, 2);
    }
    
    /**
     * Create a log entry object
     * @private
     */
    static _createLogEntry(level, module, message, data) {
        return {
            timestamp: new Date().toISOString(),
            level: level,
            module: module,
            message: message,
            data: data,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
    }
    
    /**
     * Add entry to log history
     * @private
     */
    static _addToHistory(entry) {
        this.logHistory.push(entry);
        
        // Keep history size manageable
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory = this.logHistory.slice(-this.maxHistorySize);
        }
    }
    
    /**
     * Log group start
     * @param {string} label - Group label
     */
    static group(label) {
        console.group(`📁 ${label}`);
    }
    
    /**
     * Log group end
     */
    static groupEnd() {
        console.groupEnd();
    }
    
    /**
     * Log a table (for objects/arrays)
     * @param {*} data - Data to display as table
     * @param {string} module - Module name
     */
    static table(data, module = 'Data') {
        if (this.currentLevel >= this.levels.DEBUG) {
            console.log(`📊 [${module}] Table data:`);
            console.table(data);
        }
    }
}

// Set log level based on environment
if (window.Environment === 'development') {
    Logger.setLevel('DEBUG');
} else if (window.Environment === 'demo') {
    Logger.setLevel('INFO');
} else {
    Logger.setLevel('WARN');
}

// Export for global access
window.Logger = Logger;

console.log('✅ Logger utility loaded');
