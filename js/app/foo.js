/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-05
 */

const foo = [
  {
    name: 'cryptocompare',
    title: 'an operator acting on cryptocompare tables',
    usage: 'cryptocompare [run|set|ls] [options]',
  },
  {
    name: 'query',
    title: 'query a database',
    usage: 'query <sql> or query set -m <model name>',
  }
];
const cmd = 'cryptocompare';
console.log(foo.find((a) => a.name === cmd));