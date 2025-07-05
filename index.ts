#!/usr/bin/env node

import {
  convertTablesToTypescriptInterface,
  initModules,
  saveInterfaceFile,
} from "database-to-interfaces";
import { write } from "fs";
import { readFile, writeFile } from "fs/promises";
import { defaultConfig } from "./defaultConfig";

async function main() {
  console.log(`
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
██ ▄▄▀█ ▄▄▀█▄▄ ▄▄█ ▄▄▀██ ▄▄▀█ ▄▄▀██ ▄▄▄ ██ ▄▄▄███▄▄ ▄▄██ ▄▄▄ ███▄ ▄██ ▀██ █▄▄ ▄▄██ ▄▄▄██ ▄▄▀██ ▄▄▄█ ▄▄▀██ ▄▄▀██ ▄▄▄██
██ ██ █ ▀▀ ███ ███ ▀▀ ██ ▄▄▀█ ▀▀ ██▄▄▄▀▀██ ▄▄▄█████ ████ ███ ████ ███ █ █ ███ ████ ▄▄▄██ ▀▀▄██ ▄▄██ ▀▀ ██ █████ ▄▄▄██
██ ▀▀ █ ██ ███ ███ ██ ██ ▀▀ █ ██ ██ ▀▀▀ ██ ▀▀▀█████ ████ ▀▀▀ ███▀ ▀██ ██▄ ███ ████ ▀▀▀██ ██ ██ ████ ██ ██ ▀▀▄██ ▀▀▀██
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
[CLI Database to Interface Generator]
[Version 0.0.1]
[Author: Edge1212]
`);

  // look if in the args there is a --create-config flag
  if (process.argv.includes("create-config")) {
    console.log(
      "Creating a default configuration file at ./configDatabase.config ..."
    );

    await writeFile("./configDatabase.config", defaultConfig);
    console.log(
      "Default configuration file created successfully! 🎉 \nPlease edit it to match your database"
    );
    return;
  }

  //leer cada linea del archivo de configuracion
  let configMap;
  try {
    configMap = await readConfigFile();
  } catch (error) {}

  if (!configMap || configMap.size === 0) {
    console.error("No configuration found 🔍. Please check your config file. ");
    return;
  }

  console.log("Configuration loaded successfully ✅");
  if (configMap.get("dbType") === undefined) {
    console.log("No database type specified 🚧 Using default: mysql ...");
  }

  let DBModuleToUse;

  DBModuleToUse = initModules(configMap.get("dbType") || "mysql", {
    host: configMap.get("host") || "localhost",
    port: parseInt(configMap.get("port") || "3306"),
    database: configMap.get("database") || "test",
    user: configMap.get("user") || "root",
    password: configMap.get("password") || "",
    schema: configMap.get("schema") || "",
  });

  //test connection

  const connectionSuccess = await DBModuleToUse.testConnection();
  if (!connectionSuccess) {
    console.error(
      "Connection failed ❌. Please check your database credentials."
    );
    return;
  }

  const r = await DBModuleToUse.getTablesMapWithColumns();
  const s = convertTablesToTypescriptInterface(
    r,
    configMap.get("prefix") || ""
  );

  await saveInterfaceFile(s, {
    fileName: configMap.get("filename") || "interfaces.ts",
    filePath: configMap.get("filepath") || "./",
  });

  console.log(`Interfaces file generated successfully! 🎉 `);
}

main();

async function readConfigFile() {
  const configFile = await readFile("./configDatabase.config", "utf-8");
  const configLines = configFile
    .split("\n")
    .map((line) => line.trim().replace(" ", ""))
    .filter((line) => line && !line.startsWith("#"));

  const configMap = new Map<string, string>();
  configLines.forEach((line) => {
    const [key, value] = line.split(":");
    if (key && value) {
      configMap.set(key, value);
    }
  });
  return configMap;
}
