import * as fs from "fs-extra";
import { parseEnv } from "node:util";
import chalk from "chalk";

function orIfFileNotExist(promise, fallbackValue) {
  return promise.catch((e) => {
    if (e.code === "ENOENT" || e.code === "ENOTDIR") {
      return fallbackValue;
    }
    throw e;
  });
}

function orNullIfFileNotExist(promise) {
  return orIfFileNotExist(promise, null);
}

export async function loadEnv(envFile) {
  const data = await orNullIfFileNotExist(
    fs.promises.readFile(envFile, "utf8")
  );
  if (data == null) {
    return null;
  }
  const parsed = parseEnv(data);
  for (const key of Object.keys(parsed)) {
    if (!process.env.hasOwnProperty(key)) {
      process.env[key] = parsed[key];
    }
  }
  return parsed;
}
/*
task_wrapper takes two inputs, task and config_file

A task is a function with the a particular input structure: its first input argument is the configuration object.
We call the rest of the inputs as regular inputs

task_wrapper reads the input config_file, create the config object, then return a function with regular inputs.

This implementation is from https://github.com/electron-userland/electron-builder/blob/f0bf67c7d87e7af4e31b24f45172cf4ba3c2ca72/packages/electron-builder/src/cli/cli.ts#L45

@param task: function(config_obj,args)
@config_file: configuration file name


*/
export const task_wrapper = (task, config_file) => {
  return (args) => {
    return loadEnv(config_file)
      .then((parsed) => {
        return task(parsed, args);
      })
      .catch((error) => {
        process.exitCode = 1;
        process.on("exit", () => (process.exitCode = 1));
        console.error(error);
        /*
        if (error instanceof InvalidConfigurationError) {
          log.error(null, error.message);
        } else if (!(error instanceof ExecError) || !error.alreadyLogged) {
          log.error({ stackTrace: error.stack }, error.message);
        }
        */
      });
  };
};

export const isImplementation = (obj, interfaceObj) => {
  for (const method in interfaceObj) {
    if (!(method in obj) || typeof obj[method] !== "function") {
      return false;
    }
  }
  return true;
};

// display object
export const formatJsonWithColor = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json
      .replace(/(".*?")(?=\s*:)/g, chalk.blue('$1')) // Color string keys in red
      .replace(/:\s*(".*?")/g, (match, p1) => {
          return `: ${chalk.green(p1)}`; // Color string values in blue
      }) 
      .replace(/:\s*(\d+|true|false|null)/g, (_, p1) => {
          return `: ${chalk.yellow(p1)}`; // Color numbers, boolean, and null in yellow
      });
};

export const json2file = async (response, filename, verb = false) => {
  fs.writeFile(`${filename}.json`, JSON.stringify(response), (err) => {
    if (err) throw new Error(err);
    if (verb) console.log(`data saved to ${filename}.json successfully`);
  });
};
