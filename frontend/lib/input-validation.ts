/**
 * Comprehensive input validation and sanitization utilities
 * Prevents JSON injection, prompt injection, and malicious input attacks
 */

export interface ValidationResult<T = any> {
  isValid: boolean;
  sanitized?: T;
  errors: string[];
  warnings?: string[];
}

export interface JSONSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  required?: string[];
  properties?: { [key: string]: JSONSchema };
  items?: JSONSchema;
  pattern?: string;
  maxLength?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  enum?: any[];
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeUserInput(input: string, maxLength: number = 50000): ValidationResult<string> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || typeof input !== 'string') {
    errors.push('Input must be a non-empty string');
    return { isValid: false, errors };
  }

  if (input.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    return { isValid: false, errors };
  }

  // Remove potential script tags and HTML
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  // Check for suspicious patterns that could indicate injection
  const suspiciousPatterns = [
    /\\u003cscript/i,  // Encoded script tags
    /\\u003c\/script/i,
    /<\?/i,           // PHP tags
    /\?>/i,
    /<%/i,           // Template engine tags
    /%>/i,
    /{{.*}}/i,       // Handlebars/Mustache
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      warnings.push('Potential injection attempt detected and sanitized');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate and parse JSON with schema support
 */
export function validateAndParseJSON(
  jsonString: string,
  schema?: JSONSchema,
  maxLength: number = 100000
): ValidationResult<any> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!jsonString || typeof jsonString !== 'string') {
    errors.push('JSON input must be a non-empty string');
    return { isValid: false, errors };
  }

  if (jsonString.length > maxLength) {
    errors.push(`JSON exceeds maximum length of ${maxLength} characters`);
    return { isValid: false, errors };
  }

  // Basic sanitization
  const sanitized = jsonString
    .trim()
    .replace(/<[^>]*>/g, ''); // Remove HTML tags

  let parsed: any;
  try {
    parsed = JSON.parse(sanitized);
  } catch (error) {
    errors.push(`Invalid JSON: ${(error as Error).message}`);
    return { isValid: false, errors };
  }

  // Schema validation
  if (schema) {
    const schemaErrors = validateAgainstSchema(parsed, schema);
    errors.push(...schemaErrors);
  }

  return {
    isValid: errors.length === 0,
    sanitized: parsed,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validate parsed JSON against schema
 */
function validateAgainstSchema(data: any, schema: JSONSchema, path: string = ''): string[] {
  const errors: string[] = [];

  if (schema.type && typeof data !== schema.type) {
    errors.push(`At ${path}: Expected type ${schema.type}, got ${typeof data}`);
  }

  if (schema.required && typeof data === 'object' && data !== null) {
    for (const required of schema.required) {
      if (!(required in data)) {
        errors.push(`At ${path}: Missing required property '${required}'`);
      }
    }
  }

  if (schema.properties && typeof data === 'object' && data !== null) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in data) {
        const subErrors = validateAgainstSchema(data[key], propSchema, `${path}.${key}`);
        errors.push(...subErrors);
      }
    }
  }

  if (schema.items && Array.isArray(data)) {
    data.forEach((item, index) => {
      const subErrors = validateAgainstSchema(item, schema.items!, `${path}[${index}]`);
      errors.push(...subErrors);
    });
  }

  if (schema.pattern && typeof data === 'string' && !new RegExp(schema.pattern).test(data)) {
    errors.push(`At ${path}: Value does not match required pattern`);
  }

  if (schema.maxLength && typeof data === 'string' && data.length > schema.maxLength) {
    errors.push(`At ${path}: Value exceeds maximum length of ${schema.maxLength}`);
  }

  if (schema.minLength && typeof data === 'string' && data.length < schema.minLength) {
    errors.push(`At ${path}: Value is below minimum length of ${schema.minLength}`);
  }

  if (schema.minimum !== undefined && typeof data === 'number' && data < schema.minimum) {
    errors.push(`At ${path}: Value is below minimum of ${schema.minimum}`);
  }

  if (schema.maximum !== undefined && typeof data === 'number' && data > schema.maximum) {
    errors.push(`At ${path}: Value exceeds maximum of ${schema.maximum}`);
  }

  if (schema.enum && !schema.enum.includes(data)) {
    errors.push(`At ${path}: Value is not one of allowed enum values`);
  }

  return errors;
}

/**
 * Validate AI response structure for pricing data
 */
export function validateAIResponse(content: string): ValidationResult<{
  hasPricingData: boolean;
  hasStructuredData: boolean;
  hasErrorMessages: boolean;
  extractedJSON?: any;
}> {
  const errors: string[] = [];

  const { isValid: inputValid, sanitized: cleanContent } = sanitizeUserInput(content, 100000);
  if (!inputValid) {
    return { isValid: false, errors };
  }

  let hasPricingData = false;
  let hasStructuredData = false;
  let hasErrorMessages = false;
  let extractedJSON: any = null;

  // Check for error messages that might indicate AI issues
  const errorPatterns = [
    /❌.*insertion.*blocked/i,
    /missing.*pricing.*data/i,
    /cannot.*parse.*json/i,
    /invalid.*json/i,
    /error.*generating/i,
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(cleanContent)) {
      hasErrorMessages = true;
      break;
    }
  }

  // Extract and validate JSON
  const jsonResult = validateAndParseJSON(
    extractJSONFromContent(cleanContent),
    getPricingJSONSchema(),
    50000
  );

  if (jsonResult.isValid && jsonResult.sanitized) {
    hasPricingData = true;
    hasStructuredData = true;
    extractedJSON = jsonResult.sanitized;
  }

  return {
    isValid: true,
    sanitized: {
      hasPricingData,
      hasStructuredData,
      hasErrorMessages,
      extractedJSON
    },
    errors,
    warnings: hasErrorMessages ? ['AI response contains error messages instead of structured data'] : undefined
  };
}

/**
 * Extract JSON content from text safely
 */
function extractJSONFromContent(text: string): string {
  // Look for ```json code blocks first
  const jsonBlocks = [...text.matchAll(/```json\s*([\s\S]*?)\s*```/gi)];
  if (jsonBlocks.length > 0) {
    return jsonBlocks[0][1].trim();
  }

  // Look for generic code blocks
  const codeBlocks = [...text.matchAll(/```\s*([\s\S]*?)\s*```/g)];
  for (const block of codeBlocks) {
    const content = block[1].trim();
    if (content.startsWith('{') && content.endsWith('}')) {
      return content;
    }
    if (content.startsWith('[') && content.endsWith(']')) {
      return content;
    }
  }

  return '';
}

/**
 * Schema for pricing JSON validation
 */
function getPricingJSONSchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      currency: {
        type: 'string',
        pattern: '^[A-Z]{3}$',
        enum: ['AUD', 'USD', 'EUR', 'GBP']
      },
      scopes: {
        type: 'array',
        items: {
          type: 'object',
          required: ['scope_name', 'roles'],
          properties: {
            scope_name: {
              type: 'string',
              minLength: 1,
              maxLength: 200
            },
            scope_total: {
              type: 'number',
              minimum: 0
            },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                required: ['role', 'hours', 'rate', 'cost'],
                properties: {
                  role: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 100
                  },
                  hours: {
                    type: 'number',
                    minimum: 0
                  },
                  rate: {
                    type: 'number',
                    minimum: 0
                  },
                  cost: {
                    type: 'number',
                    minimum: 0
                  }
                }
              }
            }
          }
        }
      },
      grand_total: {
        type: 'number',
        minimum: 0
      }
    }
  };
}
