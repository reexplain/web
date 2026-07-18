import type { StagedPdfRecord } from "@/types/pdf";

const DATABASE_NAME = "reexplain-uploads";
const STORE_NAME = "files";
const STAGED_PDF_KEY = "current-pdf";

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const stagePdf = async (file: File) => {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const record: StagedPdfRecord = {
      blob: file,
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
    };

    transaction.objectStore(STORE_NAME).put(record, STAGED_PDF_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
};

export const getStagedPdf = async () => {
  const database = await openDatabase();
  const record = await new Promise<StagedPdfRecord | undefined>((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .get(STAGED_PDF_KEY);

    request.onsuccess = () => resolve(request.result as StagedPdfRecord | undefined);
    request.onerror = () => reject(request.error);
  });

  database.close();

  if (!record) return null;

  return new File([record.blob], record.name, {
    type: record.type,
    lastModified: record.lastModified,
  });
};

export const clearStagedPdf = async () => {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(STAGED_PDF_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
};
