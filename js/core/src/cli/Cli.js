/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-03
 */

import readline from "node:readline";
import SpecHandler from "./SpecHandler";

const commandLineProcessor = (line, spec_handler) => {
  const inputTokens = (line) => {
    const t = line
      .trim()
      .split(" ")
      .filter((a) => a != "");
    return t.length > 0 ? [R.head(t), R.tail(t)] : [];
  };

  const paramLineProcessor = (cmd, args) => {
    if (
      !R.has("options", spec_handler.master_info) ||
      !R.has(cmd, spec_handler.master_info.options)
    ) {
      throw new Error("Unknown param command");
    } else
      return parseArgs({
        options: spec_handler.master_info.options[cmd],
        tokens: true,
        allowPositionals: true,
        args: args,
      });
  };

  const [cmd, args] = inputTokens(line);
  let parameters;
  let ct = spec_handler.commandType(cmd);
  if (ct === "user_cmd" || ct === "system_cmd") {
    parameters = args;
  } else if (ct === "param_cmd") {
    parameters = paramLineProcessor(cmd, args);
  } else {
    throw new Error("Unknown command");
  }
  return [cmd, ct, parameters];
};

export default class {
  constructor(spec) {
    this.spec_handler = new SpecHandler(spec);
  }
  async run(method) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.spec_handler.prompt(),
    });
    rl.prompt();
    rl.on("line", async (line) => {
      let cmd = "";
      let args = [];
      try {
        const inputs = line.trim().split(' ').filter((a)=>a!='');
        cmd = inputs[0];
        // only allow one argument, other arguments are ignored
        args = inputs.slice(1);
      } catch (error) {
        console.log(`${error.message}`);
      }
      rl.prompt();
    }).on("close", () => {
      console.log("So long...");
      process.exit(0);
    });
  }
}
