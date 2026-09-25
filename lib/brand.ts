export function brandMarkFromName(name: string): string {
  const match = name.trim().match(/[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ]/);
  return (match?.[0] ?? "7").toUpperCase();
}
