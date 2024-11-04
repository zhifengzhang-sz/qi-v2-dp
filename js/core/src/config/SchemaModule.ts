// src/config/SchemaModule.ts

import { ValidateFunction } from 'ajv';
/**
 * Interface for Schema Modules
 */
export interface SchemaModule<T> {
  schemas: Record<string, object>;
  install(schema: object): ValidateFunction;
  init(): Record<string, ValidateFunction>;
}