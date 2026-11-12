// Entry point of the command-line tool (dist/cli.js).
import { runCli } from "./cli";

const color = Boolean(process.stdout.isTTY) && !process.env["NO_COLOR"] && process.env["TERM"] !== "dumb";
process.exitCode = runCli(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  color,
});
