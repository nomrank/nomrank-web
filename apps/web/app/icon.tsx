import { appIcon } from "@/lib/app-icon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return appIcon(512, true, true);
}
