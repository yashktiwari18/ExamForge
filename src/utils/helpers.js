export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const fmtTime = (sec) => {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

export function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const meta = result.split(",")[0];
      const data = result.split(",")[1];
      const mediaType = (meta.match(/data:(.*?);base64/) || [, "image/png"])[1];
      resolve({ data, mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
