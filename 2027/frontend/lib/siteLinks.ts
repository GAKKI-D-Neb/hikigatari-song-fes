import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type SitePhase = "planning" | "prelaunch" | "live" | "ended";

type Settings = {
  links?: {
    work_registration_form?: string;
    twipla?: string;
    organizer_x?: string;
    contact_x?: string;
    illustrator_x?: string;
  };

  site?: {
    phase?: SitePhase;
    show_sample_works?: boolean;
    show_sample_comments?: boolean;
    accept_comments?: boolean;
    public_url?: string;
  };
};

// 2027/frontend/ を基準に設定ファイルを取得
const settingsPath = resolve(
  process.cwd(),
  "../config/settings.json"
);

const settings: Settings = JSON.parse(
  readFileSync(settingsPath, "utf-8")
);

// URL設定
export const siteLinks = {
  workRegistrationForm:
    settings.links?.work_registration_form?.trim() ?? "",

  twipla:
    settings.links?.twipla?.trim() ?? "",

  organizerX:
    settings.links?.organizer_x?.trim() ?? "",

  contactX:
    settings.links?.contact_x?.trim() ||
    settings.links?.organizer_x?.trim() ||
    "",

  illustratorX:
    settings.links?.illustrator_x?.trim() ?? "",
};

// 開催フェーズ・公開設定
export const siteSettings = {
  phase:
    settings.site?.phase ?? "planning",

  showSampleWorks:
    settings.site?.show_sample_works ?? false,

  showSampleComments:
    settings.site?.show_sample_comments ?? false,

  acceptComments:
    settings.site?.accept_comments ?? false,

  publicUrl:
    settings.site?.public_url?.trim() ?? "",
};

// ページの表示条件
const isBeforeEvent =
  siteSettings.phase === "planning" ||
  siteSettings.phase === "prelaunch";

export const showWorks =
  !isBeforeEvent || siteSettings.showSampleWorks;

export const showComments =
  !isBeforeEvent || siteSettings.showSampleComments;

// 既存コードとの互換性
export const workRegistrationFormUrl =
  siteLinks.workRegistrationForm;