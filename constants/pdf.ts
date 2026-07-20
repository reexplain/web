import { APP_NAME } from "@/constants/app";

export const PDF_CONTENT_TYPE = "application/pdf";
export const MAX_PDF_SIZE_MB = 20;
export const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;
export const MAX_PDF_PAGE_COUNT = 25;
export const PDF_UPLOAD_DESCRIPTION =
  `Upload learning material in PDF form, such as a textbook chapter, research paper, or study notes. ${APP_NAME} will turn it into an interactive explanation session.`;
export const PDF_UPLOAD_BUTTON_LABEL = "Choose learning material";
export const PDF_UPLOAD_DROP_HINT = "or drag your learning material into this box";
export const PDF_UPLOAD_LIMITS_LABEL =
  `PDF format • Up to ${MAX_PDF_SIZE_MB} MB • ${MAX_PDF_PAGE_COUNT} pages max`;
