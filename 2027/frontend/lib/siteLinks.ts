import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// 2027/frontend/ を基準に設定ファイルを取得
const settingsPath = resolve(
  process.cwd(),
  "../config/settings.json"
);

type Settings = {
  links?: {
    work_registration_form?: string;
  };
};

const settings: Settings = JSON.parse(
  readFileSync(settingsPath, "utf-8")
);

export const workRegistrationFormUrl =
  settings.links?.work_registration_form?.trim() ?? "";