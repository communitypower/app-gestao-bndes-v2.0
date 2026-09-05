import { TRPCError } from "@trpc/server";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  MAX_UPLOAD_BYTES,
} from "../shared/domain";
import { storagePut } from "./storage";

export type UploadedFileInput = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  base64: string;
};

function extensionOf(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function sanitizeUploadedFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 180);
}

export function validateUploadedFileMetadata(
  input: Pick<UploadedFileInput, "fileName" | "fileSize">
) {
  const extension = extensionOf(input.fileName);
  if (!ALLOWED_UPLOAD_EXTENSIONS.includes(extension as never)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Formato .${extension || "desconhecido"} não permitido.`,
    });
  }

  if (input.fileSize <= 0 || input.fileSize > MAX_UPLOAD_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "O arquivo deve ter até 20 MB.",
    });
  }
  return extension;
}

export async function uploadProjectFile(
  folder: "library" | "production" | "interfaces",
  sectionCode: string,
  input: UploadedFileInput
) {
  const extension = validateUploadedFileMetadata(input);

  const rawBase64 = input.base64.includes(",")
    ? input.base64.split(",").pop() ?? ""
    : input.base64;
  const buffer = Buffer.from(rawBase64, "base64");
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "O conteúdo do arquivo é inválido ou excede 20 MB.",
    });
  }

  const normalizedName = sanitizeUploadedFileName(input.fileName) || `arquivo.${extension}`;
  return storagePut(
    `${folder}/${sectionCode}/${Date.now()}-${normalizedName}`,
    buffer,
    input.mimeType || "application/octet-stream"
  );
}
