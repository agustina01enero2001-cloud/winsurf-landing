import fs from "fs";
import path from "path";

export function getHeroVideoSrc(): string {
  const filePath = path.join(process.cwd(), "public", "hero.mp4");

  if (!fs.existsSync(filePath)) {
    return "/hero.mp4";
  }

  const { mtimeMs } = fs.statSync(filePath);
  return `/hero.mp4?v=${Math.floor(mtimeMs)}`;
}
