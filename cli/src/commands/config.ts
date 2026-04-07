/**
 * cv config — view and modify CLI configuration
 *
 * Subcommands:
 *   cv config show              Print entire configuration
 *   cv config get <key>         Print single config value
 *   cv config set <key> <val>   Set a config value
 */

import { Command } from "commander";
import chalk from "chalk";
import { CONFIG_FILE, loadConfig, setConfigValue, CareerVividConfig } from "../config.js";
import { printError, printSuccess } from "../output.js";

const VALID_KEYS: (keyof CareerVividConfig)[] = ["apiKey", "apiUrl", "geminiKey", "targetCompanies"];

export function registerConfigCommand(program: Command): void {
    const config = program
        .command("config")
        .description("View and modify CLI configuration (~/.careervividrc.json)");

    // ── show ──────────────────────────────────────────────────────────────────────
    config
        .command("show")
        .description("Print current configuration")
        .option("--json", "Machine-readable output")
        .action((opts: { json?: boolean }) => {
            const jsonMode = !!opts.json;
            const cfg = loadConfig();

            if (jsonMode) {
                // Never leak the full key in JSON — mask it
                const masked = { ...cfg };
                if (masked.apiKey) masked.apiKey = `${masked.apiKey.slice(0, 16)}...`;
                console.log(JSON.stringify({ configFile: CONFIG_FILE, config: masked }));
                return;
            }

            console.log();
            console.log(`  ${chalk.bold("Config file:")} ${chalk.dim(CONFIG_FILE)}`);
            console.log();

            if (!cfg.apiKey && !cfg.apiUrl) {
                console.log(`  ${chalk.dim("No configuration set. Run: cv auth set-key")}`);
                console.log();
                return;
            }

            if (cfg.apiKey) {
                const masked = `${cfg.apiKey.slice(0, 16)}${"•".repeat(cfg.apiKey.length - 16)}`;
                console.log(`  ${chalk.dim("apiKey".padEnd(12))}  ${masked}`);
            }
            if (cfg.geminiKey) {
                const gk = cfg.geminiKey;
                const maskedGk = `${gk.slice(0, 8)}${"•".repeat(Math.max(0, gk.length - 8))}`;
                console.log(`  ${chalk.dim("geminiKey".padEnd(12))}  ${maskedGk}`);
            }
            if (cfg.apiUrl) {
                console.log(`  ${chalk.dim("apiUrl".padEnd(12))}  ${cfg.apiUrl}`);
            }
            if (cfg.targetCompanies) {
                console.log(`  ${chalk.dim("targetCompanies".padEnd(16))}  ${cfg.targetCompanies}`);
            }
            console.log();
        });

    // ── get ───────────────────────────────────────────────────────────────────────
    config
        .command("get <key>")
        .description(`Get a config value (keys: ${VALID_KEYS.join(", ")})`)
        .option("--json", "Machine-readable output")
        .action((key: string, opts: { json?: boolean }) => {
            const jsonMode = !!opts.json;

            if (!VALID_KEYS.includes(key as keyof CareerVividConfig)) {
                printError(`Unknown key "${key}". Valid keys: ${VALID_KEYS.join(", ")}`, undefined, jsonMode);
                process.exit(1);
            }

            const cfg = loadConfig();
            const value = cfg[key as keyof CareerVividConfig];

            if (!value) {
                if (jsonMode) {
                    console.log(JSON.stringify({ key, value: null }));
                } else {
                    console.log(`  ${chalk.dim(key)} is not set`);
                }
                return;
            }

            // Mask all sensitive keys — never print raw values to the terminal
            const SENSITIVE_KEYS = new Set(["apiKey", "geminiKey"]);
            const displayValue = SENSITIVE_KEYS.has(key)
                ? `${value.slice(0, 8)}${"•".repeat(Math.max(0, value.length - 8))}`
                : value;

            if (jsonMode) {
                console.log(JSON.stringify({ key, value: displayValue }));
            } else {
                console.log(`  ${chalk.dim(key.padEnd(10))}  ${displayValue}`);
            }
        });

    // ── set ───────────────────────────────────────────────────────────────────────
    config
        .command("set <key> <value>")
        .description(`Set a config value (keys: ${VALID_KEYS.join(", ")})`)
        .option("--json", "Machine-readable output")
        .action((key: string, value: string, opts: { json?: boolean }) => {
            const jsonMode = !!opts.json;

            if (!VALID_KEYS.includes(key as keyof CareerVividConfig)) {
                printError(`Unknown key "${key}". Valid keys: ${VALID_KEYS.join(", ")}`, undefined, jsonMode);
                process.exit(1);
            }

            setConfigValue(key as keyof CareerVividConfig, value);

            printSuccess(
                { key, saved: "true", configFile: CONFIG_FILE },
                jsonMode
            );
        });
}
