// Entry point of the GitHub Action (dist/index.js).
import { runAction } from "./action";

process.exitCode = runAction(process.env);
