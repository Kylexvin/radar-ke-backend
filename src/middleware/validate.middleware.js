import { validationErrorResponse } from '../utils/response.js';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Validate required fields in request body
 * @param {Array<string>} requiredFields - Array of field names that must be present
 * @returns {Function} Express middleware
 */
export const validateRequired = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      // Check nested fields with dot notation (e.g., 'user.email')
      if (field.includes('.')) {
        const parts = field.split('.');
        let value = req.body;
        for (const part of parts) {
          if (value && typeof value === 'object') {
            value = value[part];
          } else {
            value = undefined;
            break;
          }
        }
        if (value === undefined || value === null || value === '') {
          missingFields.push(field);
        }
      } else {
        // Simple field
        const value = req.body[field];
        if (value === undefined || value === null || value === '') {
          missingFields.push(field);
        }
      }
    }

    if (missingFields.length > 0) {
      return validationErrorResponse(res, [
        {
          message: `Required field(s) missing: ${missingFields.join(', ')}`,
          missingFields
        }
      ]);
    }

    next();
  };
};

/**
 * Validate specific fields with custom validation functions
 * @param {Object} validations - Object mapping field names to validation functions
 * @returns {Function} Express middleware
 */
export const validateCustom = (validations) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, validationFn] of Object.entries(validations)) {
      const value = req.body[field];
      const error = validationFn(value, req.body);
      if (error) {
        errors.push({
          field,
          message: error
        });
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    next();
  };
};

/**
 * Validate request body against a schema of required fields and types
 * @param {Object} schema - Schema object with field names and validation rules
 * @returns {Function} Express middleware
 */
export const validateSchema = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: rules.message || `${field} is required`
        });
        continue;
      }

      // Skip further validation if field is not present and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Check type
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push({
            field,
            message: `${field} must be of type ${rules.type}, got ${actualType}`
          });
          continue;
        }
      }

      // Check min length for strings
      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.minLength} characters`
        });
      }

      // Check max length for strings
      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push({
          field,
          message: `${field} cannot exceed ${rules.maxLength} characters`
        });
      }

      // Check min for numbers
      if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.min}`
        });
      }

      // Check max for numbers
      if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        errors.push({
          field,
          message: `${field} cannot exceed ${rules.max}`
        });
      }

      // Custom validation function
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(value, req.body);
        if (customError) {
          errors.push({
            field,
            message: customError
          });
        }
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    next();
  };
};

// Common validation helpers for reuse
export const validators = {
  isPhone: (value) => {
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(value)) {
      return 'Phone number must be 10-15 digits';
    }
    return null;
  },
  
  isEmail: (value) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },
  
  isCoordinate: (value) => {
    if (!Array.isArray(value) || value.length !== 2) {
      return 'Coordinates must be [longitude, latitude] array';
    }
    const [lng, lat] = value;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return 'Invalid coordinate range: lon (-180 to 180), lat (-90 to 90)';
    }
    return null;
  },
  
  isColorHex: (value) => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(value)) {
      return 'Color must be a valid hex code (e.g., #3B82F6)';
    }
    return null;
  }
};