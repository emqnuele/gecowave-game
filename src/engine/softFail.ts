/** un errore che non deve fermare il gioco: resta scritto in console invece di sparire */
export function softFail(where: string, e: unknown): void {
    console.error(`[${where}]`, e);
}
