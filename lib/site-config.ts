import { DEFAULT_WA_MESSAGES_BODY } from "@/lib/default-wa-messages";

export type WaPhoneConfig = {
  number: string;
  label?: string;
};

/** Editá estos números antes de deployar a producción. */
export const WA_PHONES: WaPhoneConfig[] = [
  { number: "5493815901533" },
  { number: "5493813591511" },
  { number: "5493815862761" },
  { number: "5493812190133" },
  { number: "5493812147753" },
  { number: "5493816200939" },
];

export const WA_MESSAGES_BODY = DEFAULT_WA_MESSAGES_BODY;
