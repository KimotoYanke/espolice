import chalk from "chalk";
import { alea } from "seedrandom";

export const eventLog = (eventType: string, pathFromRoot: string) => {
  const rng = alea(eventType, { entropy: true });
  const h = Math.floor(rng() * 360);
  const s = Math.floor(rng() * 20) + 80;
  const l = Math.floor(rng() * 20) + 30;
  console.log(chalk.white.bgHsl(h, s, l)(eventType) + "\t" + pathFromRoot);
};

export const msgLog = (
  msg: string,
  pathFromRoot: string,
  ...rest: string[]
) => {
  const rng = alea(msg, { entropy: true });
  const h = Math.floor(rng() * 360);
  const s = Math.floor(rng() * 20) + 80;
  const l = Math.floor(rng() * 20) + 30;
  console.log(
    chalk.white.bgHsl(h, s, l)(msg) +
      "\t" +
      pathFromRoot +
      "\t" +
      rest.join("\t")
  );
};
