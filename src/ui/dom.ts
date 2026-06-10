/** crea un elemento con classi, contenuto e attributi in una riga */
export function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className = '',
    html = ''
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html) node.innerHTML = html;
    return node;
}

export const ui = (): HTMLElement => document.getElementById('ui')!;
