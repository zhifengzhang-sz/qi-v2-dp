/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-05
 */

/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-10-31
 */

/**
 * @fileoverview Utility functions for file operations, environment loading, task wrapping,
 * interface checking, JSON formatting and array operations.
 * @module utils
 * @requires fs-extra
 * @requires node:util
 * @requires chalk
 */
import * as fs from "fs-extra";
import { parseEnv } from "node:util";
import chalk from "chalk";

/**
 * Handles file not found errors by returning a fallback value.
 * @param {Promise} promise - The promise to handle.
 * @param {*} fallbackValue - The value to return if the file is not found.
 * @returns {Promise} - The promise with error handling.
 */
function orIfFileNotExist(promise, fallbackValue) {
  return promise.catch((e) => {
    if (e.code === "ENOENT" || e.code === "ENOTDIR") {
      return fallbackValue;
    }
    throw e;
  });
}

/**
 * Handles file not found errors by returning null.
 * @param {Promise} promise - The promise to handle.
 * @returns {Promise} - The promise with error handling.
 */
function orNullIfFileNotExist(promise) {
  return orIfFileNotExist(promise, null);
}

/**
 * Loads environment variables from a file.
 * @param {string} envFile - The path to the environment file.
 * @returns {Promise<Object|null>} - The parsed environment variables or null if the file does not exist.
 */
export async function loadEnv(envFile) {
  const data = await orNullIfFileNotExist(fs.promises.readFile(envFile, "utf8"));
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

/**
 * Wraps a task function with configuration loading.
 * @param {Function} task - The task function to wrap.
 * @param {string} configFile - The path to the configuration file.
 * @returns {Function} - The wrapped task function.
 */
export const taskWrapper = (task, configFile) => {
  return (args) => {
    return loadEnv(configFile)
      .then((parsed) => task(parsed, args))
      .catch((error) => {
        process.exitCode = 1;
        console.error(error);
      });
  };
};

/**
 * Checks if an object implements an interface.
 * @param {Object} obj - The object to check.
 * @param {Object} interfaceObj - The interface to check against.
 * @returns {boolean} - True if the object implements the interface, false otherwise.
 */
export const isImplementation = (obj, interfaceObj) => {
  for (const method in interfaceObj) {
    if (!(method in obj) || typeof obj[method] !== "function") {
      return false;
    }
  }
  return true;
};

/**
 * Formats a JSON object with color.
 * @param {Object} obj - The JSON object to format.
 * @returns {string} - The formatted JSON string.
 */
export const formatJsonWithColor = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/(".*?")(?=\s*:)/g, chalk.blue('$1')) // Color string keys in blue
    .replace(/:\s*(".*?")/g, (match, p1) => `: ${chalk.green(p1)}`) // Color string values in green
    .replace(/:\s*(\d+|true|false|null)/g, (_, p1) => `: ${chalk.yellow(p1)}`); // Color numbers, boolean, and null in yellow
};

/**
 * Saves a JSON object to a file.
 * @param {Object} response - The JSON object to save.
 * @param {string} filename - The name of the file.
 * @param {boolean} [verbose=false] - Whether to log a success message.
 * @returns {Promise<void>} - A promise that resolves when the file is saved.
 */
export const json2file = async (response, filename, verbose = false) => {
  try {
    await fs.writeFile(`${filename}.json`, JSON.stringify(response));
    if (verbose) console.log(`Data saved to ${filename}.json successfully`);
  } catch (err) {
    throw new Error(err);
  }
};

/**
 * Zips two arrays together.
 * @param {Array} a - The first array.
 * @param {Array} b - The second array.
 * @returns {Array} - The zipped array.
 */
export const zip = (a, b) => a.map((k, i) => [k, b[i]]);