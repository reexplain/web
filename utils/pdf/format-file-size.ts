export const formatFileSize = (bytes: number) =>
  `${(bytes / 1024 / 1024).toFixed(1)} MB`;
