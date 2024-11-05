// src/config/schemas/SchemaModule.ts

import { Ajv, ValidateFunction } from "ajv";
import { schemas } from "@qi/core/cli/schemas/CliSpecSchema"; // Import all schemas
import { ServiceConfig, schemas as serviceSchemas } from "@qi/core/services/schemas/ServiceSchema"; // Import service schemas

export interface SchemaModule<T> {
  schemas: Record<string, object>;
  init: () => Record<string, ValidateFunction>;
}

class CentralizedAJV {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: true });
    Object.values(schemas).forEach((sch) => this.ajv.addSchema(sch));
    Object.values(serviceSchemas).forEach((sch) => this.ajv.addSchema(sch));
  }

  public compile<T>(schema: object): ValidateFunction {
    return this.ajv.compile(schema);
  }

  public getValidateFunction(schemaId: string): ValidateFunction | undefined {
    return this.ajv.getSchema(schemaId);
  }
}

const ajvInstance = new CentralizedAJV();

export { ajvInstance };