import Ajv from 'ajv';
import { DataSourceConfig } from '../sources';

const configSchema = {
  type: 'object',
  required: ['name', 'models', 'associations'],
  properties: {
    name: { type: 'string' },
    models: {
      type: 'array',
      items: { type: 'string' }
    },
    associations: {
      type: 'array',
      items: {
        type: 'object',
        required: ['source', 'target', 'type'],
        properties: {
          source: { type: 'string' },
          target: { type: 'string' },
          type: { 
            type: 'string',
            enum: ['belongsTo', 'hasMany', 'hasOne']
          }
        }
      }
    }
  }
};

const ajv = new Ajv();
const validate = ajv.compile(configSchema);

export function validateDataSourceConfig(config: DataSourceConfig): boolean {
  const isValid = validate(config);
  if (!isValid) {
    throw new Error(`Invalid data source config: ${ajv.errorsText(validate.errors)}`);
  }
  return true;
}