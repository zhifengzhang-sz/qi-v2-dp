/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-03
 */

/**
 * @fileoverview Handles CLI specifications, including validation, master information extraction, and help message generation.
 * @module SpecHandler
 * 
 * @requires CliConfig
 */

/**
 * @class SpecHandler
 * @description Handles CLI specifications, including validation, master information extraction, and help message generation.
 */
class SpecHandler {
  /**
   * @constructor
   * @param {CliConfig} config - An instance of the CliConfig class
   */
  constructor(config) {
    this.spec = config.getSpec();
    // Validate the spec
    this._validateSpec(this.spec, config.getValidationSchema()["QICliMain"]);
    // Master information
    this.master_info = this._masterInfo(this.spec);
    // Help message
    this.help_message = this._helpMessage(this.spec);
  }

  /**
   * @method _validateSpec
   * @description Validates the CLI specification using the provided validator
   * @param {Object} spec - The CLI specification object
   * @param {Function} validator - The validation function
   * @throws {Error} If the specification is invalid
   * @private
   */
  _validateSpec(spec, validator) {
    if (!validator(spec)) throw new Error(validator.errors);
  }

  /**
   * @method _masterInfo
   * @description Extracts master information from the CLI specification
   * @param {Object} spec - The CLI specification object
   * @returns {Object} Master information extracted from the specification
   * @private
   */
  _masterInfo(spec) {
    const getParamProp = (p, { cmd: { param_cmd = [] } }) =>
      param_cmd.reduce((result, { name, params = [] }) => {
        const props = params
          .filter(param => param.hasOwnProperty(p))
          .map(({ name, [p]: value }) => [name, value]);
        return props.length
          ? { ...result, [name]: Object.fromEntries(props) }
          : result;
      }, {});

    const specProperties = {
      user_cmd: ({ cmd: { user_cmd = [] } }) => user_cmd.map(({ name }) => name),
      param_cmd: ({ cmd: { param_cmd = [] } }) => param_cmd.map(({ name }) => name),
      system_cmd: (spec) => Object.keys(spec.cmd.system_cmd),
      options: (spec) => getParamProp("option", spec),
      usages: (spec) => getParamProp("usage", spec),
      titles: (spec) => getParamProp("title", spec),
      parameters: (spec) =>
        Object.fromEntries(
          Object.entries(getParamProp("option", spec)).map(([key, value]) => [
            key,
            Object.fromEntries(
              Object.entries(value).map(([k, v]) => [k, v.default])
            ),
          ])
        ),
    };

    return Object.fromEntries(
      Object.entries(specProperties).map(([key, value]) => [key, value(spec)])
    );
  }

  /**
   * @method _helpMessage
   * @description Generates a help message from the CLI specification
   * @param {Object} spec - The CLI specification object
   * @returns {string} The generated help message
   * @private
   */
  _helpMessage(spec) {
    const getCommandTitles = (commands) =>
      commands.map(({ name, title }) => ` - ${name}: ${title}`);

    const getUserCmdTitles = () => getCommandTitles(spec.cmd?.user_cmd || []);
    const getParamCmdTitles = () => getCommandTitles(spec.cmd?.param_cmd || []);
    const getSystemCmdTitles = () => {
      const systemCommands = Object.entries(spec.cmd.system_cmd).map(
        ([key, { title }]) => ` - ${key}: ${title}`
      );
      return systemCommands;
    };

    return [
      "System commands:",
      ...getSystemCmdTitles(),
      "Param commands:",
      ...getParamCmdTitles(),
      "Commands without param:",
      ...getUserCmdTitles(),
    ].join("\n");
  }

  /**
   * @method commandUsage
   * @description Generates usage information for a given command
   * @param {string} cmd - The command name
   * @returns {string} The usage information for the command
   * @throws {Error} If the command is unknown
   */
  commandUsage(cmd) {
    const paramCommandUsage = (cmd) => {
      const param_usage = (cmd, param) => this.master_info.usages[cmd][param];
      const command_option = (cmd) =>
        Object.entries(this.master_info.options[cmd]).reduce(
          (acc, [k, v]) =>
            acc + ` -${v.short}, --${k}: ${param_usage(cmd, k)}\n  `,
          ""
        );
      return `${cmd} [run|set|ls] [args]\n args:\n  ${command_option(
        cmd
      )}if args not specified, the last set value will be used, if an arg has never been set, then the default value will be used.`;
    };

    const systemCommandUsage = (cmd) =>
      `${cmd}: ${this.spec.cmd.system_cmd[cmd].title}`;
    const userCommandUsage = (cmd) =>
      this.spec.cmd.user_cmd.find((a) => a.name === cmd).title;

    const ct = this.commandType(cmd);
    if (ct === undefined)
      throw new Error("Unknown command in SpecHandler.commandUsage");
    else if (ct === "param_cmd") return paramCommandUsage(cmd);
    else if (ct === "system_cmd") return systemCommandUsage(cmd);
    else return userCommandUsage(cmd);
  }

  /**
   * @method commandType
   * @description Determines the type of a given command
   * @param {string} cmd - The command name
   * @returns {string|undefined} The command type or undefined if the command is unknown
   */
  commandType(cmd) {
    if (
      this.master_info.user_cmd &&
      this.master_info.user_cmd.includes(cmd)
    )
      return "user_cmd";
    else if (
      this.master_info.param_cmd &&
      this.master_info.param_cmd.includes(cmd)
    )
      return "param_cmd";
    else if (this.master_info.system_cmd.includes(cmd))
      return "system_cmd";
    else return undefined;
  }
}

export default SpecHandler;