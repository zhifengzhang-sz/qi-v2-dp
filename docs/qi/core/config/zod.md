Let me explain the core concepts of Zod and how to effectively use it.

```typescript
import { z } from "zod";

// 1. Basic Types
const stringSchema = z.string();
const numberSchema = z.number();
const booleanSchema = z.boolean();
const nullSchema = z.null();
const undefinedSchema = z.undefined();
const anySchema = z.any();
const unknownSchema = z.unknown();

// 2. Literals and Enums
const literalSchema = z.literal("hello");
const enumSchema = z.enum(["Small", "Medium", "Large"]);
const nativeEnumSchema = z.nativeEnum(UserRole); // For TypeScript enums

// 3. Objects
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(120).optional(),
  role: z.enum(["admin", "user"]).default("user"),
});
type User = z.infer<typeof userSchema>; // TypeScript type inference

// 4. Arrays
const stringArraySchema = z.array(z.string());
const numberArraySchema = z.array(z.number())
  .nonempty() // Must have at least one element
  .min(2)     // Minimum length
  .max(5);    // Maximum length

// 5. Unions and Intersections
const unionSchema = z.union([z.string(), z.number()]);
const intersectionSchema = z.intersection(
  z.object({ name: z.string() }),
  z.object({ age: z.number() })
);

// 6. Optional and Nullable
const optionalString = z.string().optional(); // string | undefined
const nullableString = z.string().nullable(); // string | null
const nullishString = z.string().nullish();  // string | null | undefined

// 7. Records (key-value objects)
const recordSchema = z.record(z.string()); // { [k: string]: string }
const specificRecordSchema = z.record(z.number(), z.boolean()); // { [k: number]: boolean }

// 8. Maps and Sets
const mapSchema = z.map(z.string(), z.number()); // Map<string, number>
const setSchema = z.set(z.string()); // Set<string>

// 9. Promises
const promiseSchema = z.promise(z.string()); // Promise<string>

// 10. String Validations
const emailSchema = z.string().email();
const urlSchema = z.string().url();
const uuidSchema = z.string().uuid();
const regexSchema = z.string().regex(/^[a-z]+$/);
const minMaxSchema = z.string().min(5).max(10);

// 11. Number Validations
const intSchema = z.number().int();
const positiveSchema = z.number().positive();
const negativeSchema = z.number().negative();
const finiteSchema = z.number().finite();
const multipleOfSchema = z.number().multipleOf(5);

// 12. Object Validations
const strictObjectSchema = z.object({
  name: z.string(),
}).strict(); // No extra properties allowed

const partialSchema = userSchema.partial(); // All fields optional
const requiredSchema = userSchema.required(); // All fields required

// 13. Custom Validations
const customSchema = z.string().refine(
  (val) => val.length > 10,
  { message: "String must be longer than 10 characters" }
);

// 14. Transformations
const transformSchema = z.string().transform((val) => val.length);
const preProcessSchema = z.preprocess(
  (val) => String(val),
  z.string()
);

// 15. Error Handling
function parseData<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    // Strict parsing - throws on invalid data
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
      // Each error has: message, path, code
    }
    throw error;
  }
}

// Or use safeParse for no exceptions
function safeParseData<T>(schema: z.ZodType<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data; // Typed as T
  } else {
    console.error("Validation errors:", result.error.errors);
    return null;
  }
}

// 16. Async Validation
const asyncSchema = z.string().refine(
  async (val) => {
    const exists = await checkUserExists(val);
    return exists;
  },
  { message: "User does not exist" }
);

// 17. Schema Composition
const baseSchema = z.object({
  id: z.number(),
  createdAt: z.date(),
});

const extendedSchema = baseSchema.extend({
  name: z.string(),
  email: z.string().email(),
});

// 18. Usage Examples
const config = {
  api: {
    url: "https://api.example.com",
    timeout: 5000,
    retries: 3,
  },
  features: {
    darkMode: true,
    notifications: {
      email: true,
      push: false,
    }
  }
};

const ConfigSchema = z.object({
  api: z.object({
    url: z.string().url(),
    timeout: z.number().positive(),
    retries: z.number().int().min(0).max(5),
  }),
  features: z.object({
    darkMode: z.boolean(),
    notifications: z.object({
      email: z.boolean(),
      push: z.boolean(),
    }),
  }),
});

// Type inference
type Config = z.infer<typeof ConfigSchema>;

// Validation
const validConfig = ConfigSchema.parse(config); // throws if invalid
const safeResult = ConfigSchema.safeParse(config); // returns success/error object

```

Key Points:

1. Type Definition:
   ```typescript
   // Define schema
   const schema = z.object({...});
   // Get TypeScript type
   type MyType = z.infer<typeof schema>;
   ```

2. Validation Methods:
   - `parse()`: Throws on invalid data
   - `safeParse()`: Returns success/error object
   - `parseAsync()`: For async validation
   - `safeparseAsync()`: Safe async validation

3. Common Patterns:
   - Chain validations: `.string().email().min(5)`
   - Optional fields: `.optional()` or `.nullable()`
   - Default values: `.default("value")`
   - Custom validation: `.refine()`
   - Transformations: `.transform()`

4. Error Handling:
   ```typescript
   if (result.success) {
     // result.data is typed
   } else {
     // result.error.errors has validation details
   }
   ```

---

I'll provide a comprehensive installation and setup guide for Zod.

# Zod Installation and Setup Guide

## 1. Installation

### Using npm
```bash
npm install zod
```

### Using yarn
```bash
yarn add zod
```

### Using pnpm
```bash
pnpm add zod
```

## 2. TypeScript Configuration

Zod requires TypeScript 4.5+. Add these compiler options to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,                      // Required
    "strictNullChecks": true,           // Required
    "target": "ES2017" // or higher     // Required
  }
}
```

## 3. Project Structure
Recommended project structure when using Zod:

```
src/
  schemas/           # Directory for Zod schemas
    user.schema.ts
    config.schema.ts
    ...
  types/            # Directory for TypeScript types
    index.ts        # Export inferred types
  validators/       # Optional: Custom validators
    index.ts
```

## 4. Basic Setup Example

```typescript
// schemas/config.schema.ts
import { z } from 'zod';

export const ConfigSchema = z.object({
  app: z.object({
    name: z.string(),
    port: z.number().int().positive(),
    env: z.enum(['development', 'staging', 'production'])
  })
});

// Infer the type
export type Config = z.infer<typeof ConfigSchema>;

// types/index.ts
export type { Config } from '../schemas/config.schema';

// usage.ts
import { ConfigSchema, type Config } from './schemas/config.schema';

// Parse with error handling
function loadConfig(data: unknown): Config {
  const result = ConfigSchema.safeParse(data);
  if (!result.success) {
    console.error('Invalid config:', result.error.format());
    process.exit(1);
  }
  return result.data;
}
```

## 5. Environment Setup

### For Node.js Projects
No additional setup needed.

### For React/Next.js Projects
No additional setup needed, works out of the box.

### For Bundlers (webpack, rollup, etc.)
No special configuration needed as Zod is ESM and CommonJS compatible.

## 6. Best Practices

### Schema Organization
```typescript
// schemas/base.schema.ts
import { z } from 'zod';

export const BaseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// schemas/user.schema.ts
import { BaseSchema } from './base.schema';

export const UserSchema = BaseSchema.extend({
  username: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(0).max(120).optional()
});
```

### Error Handling Utilities
```typescript
// utils/validation.ts
import { z } from 'zod';

export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(e => e.message)
    };
  }
  return {
    success: true,
    data: result.data
  };
}
```

## 7. Common Issues and Solutions

### Issue: "Type 'null' is not assignable to type 'never'"
Solution: Use `.nullable()` or `.nullish()`:
```typescript
const schema = z.string().nullable(); // string | null
const nullishSchema = z.string().nullish(); // string | null | undefined
```

### Issue: Optional fields with defaults
Solution: Use `.default()`:
```typescript
const schema = z.object({
  name: z.string(),
  age: z.number().default(0),
  role: z.enum(['user', 'admin']).default('user')
});
```

### Issue: Custom type validation
Solution: Use `.refine()`:
```typescript
const schema = z.string().refine(
  (val) => validateCustomLogic(val),
  { message: 'Custom validation failed' }
);
```

## 8. Testing Setup

### With Jest
```typescript
// __tests__/schema.test.ts
import { UserSchema } from '../schemas/user.schema';

describe('UserSchema', () => {
  it('should validate correct user data', () => {
    const userData = {
      username: 'john_doe',
      email: 'john@example.com',
      age: 25
    };
    expect(() => UserSchema.parse(userData)).not.toThrow();
  });

  it('should reject invalid email', () => {
    const userData = {
      username: 'john_doe',
      email: 'invalid-email',
      age: 25
    };
    expect(() => UserSchema.parse(userData)).toThrow();
  });
});
```

## 9. Performance Considerations

- Schema definition is expensive - define schemas outside of functions
- Use `.safeParse()` instead of try/catch with `.parse()`
- For frequent validations, consider caching schema instances

```typescript
// Good
const userSchema = z.object({...});
function validateUser(data: unknown) {
  return userSchema.safeParse(data);
}

// Bad - don't do this
function validateUser(data: unknown) {
  const schema = z.object({...}); // Schema created each time
  return schema.safeParse(data);
}
```

The key advantages of using Zod:

1. Type Inference:
   - Automatic TypeScript type generation
   - No need to maintain separate type definitions

2. Runtime Validation:
   - Strong runtime type checking
   - Detailed error messages
   - Easy to use API

3. Developer Experience:
   - Great IDE support
   - Excellent documentation
   - Active community

4. Performance:
   - Efficient validation
   - Small bundle size
   - Tree-shakeable

Would you like me to:
1. Show more specific usage examples?
2. Explain any particular validation patterns?
3. Demonstrate integration with specific frameworks?
4. Show how to migrate from other validation libraries?