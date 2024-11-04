export interface DataSourceConfig {
  name: string;
  models: string[];
  associations: Array<{
    source: string;
    target: string;
    type: 'belongsTo' | 'hasMany' | 'hasOne';
  }>;
}

export class CryptoCompareSource implements DataSourceConfig {
  name = 'cryptocompare';
  models = ['Market', 'Instrument', 'OHLCV'];
  associations: Array<{ source: string; target: string; type: 'belongsTo' | 'hasMany' | 'hasOne' }> = [
    { source: 'Instrument', target: 'Market', type: 'belongsTo' },
    { source: 'Market', target: 'Instrument', type: 'hasMany' },
    { source: 'OHLCV', target: 'Instrument', type: 'belongsTo' },
    { source: 'Instrument', target: 'OHLCV', type: 'hasMany' }
  ];
}