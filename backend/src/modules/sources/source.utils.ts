const SOURCE_KEY_SEPARATOR = "_";

export function toSourceLabel(sourceKey: string) {
  const normalizedSourceKey = sourceKey.trim();
  if (!normalizedSourceKey) {
    return "Unknown Source";
  }

  return normalizedSourceKey
    .split(SOURCE_KEY_SEPARATOR)
    .map((segment) => {
      if (/^\d{4}$/.test(segment)) {
        return segment;
      }

      return segment.toUpperCase();
    })
    .join(" ");
}
