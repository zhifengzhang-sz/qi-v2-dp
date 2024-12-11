/**
 * @fileoverview
 * @module base.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// data/models/storage/sequelize/cryptocompare/base.ts

import { DataTypes, Model, ModelAttributes } from "sequelize";
import { BaseResponseFields } from "../../../sources/cryptocompare/types.js";

// Define a type for the Sequelize attribute configuration
export const baseModelConfig: ModelAttributes<Model, BaseResponseFields> = {
  TYPE: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  MARKET: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  INSTRUMENT: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  MAPPED_INSTRUMENT: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  BASE: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  QUOTE: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  BASE_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  QUOTE_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  TRANSFORM_FUNCTION: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
};
