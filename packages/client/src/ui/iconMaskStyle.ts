export function iconMaskStyle(icon: string) {
  const mask = `url("${icon}") center / contain no-repeat`;
  return {
    WebkitMask: mask,
    mask,
  };
}
