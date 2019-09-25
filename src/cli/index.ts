import chalk from "chalk";
export const eventLog = (eventType: string, pathFromRoot: string) => {
  console.log(chalk.white.bgCyan(eventType) + "\t" + pathFromRoot);
};
