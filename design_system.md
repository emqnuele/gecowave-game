# GECOWAVE Design System

> **"Acid Glass"** — glassmorphism scuro e acido, etichette adesive storte, scritte a pennarello e gechi ovunque. Un sistema che sembra costruito da un collettivo di amici senza supervisione adulta, perché è esattamente quello che racconta.

Questo documento descrive il design system usato su tutto il sito: home, releases, about, riba (hub, chat, blog, articoli), pedro, podcast e footer. La hero della home è l'unica zona "legacy" (titolo glitch + sfondo psichedelico) e il sistema le si aggancia solo nei contorni.

---

## 1. Filosofia

Il principio guida: **il sito è il gruppo**. Gecowave fa rap demenziale italiano fatto di inside joke, serate registrate e personaggi assurdi — quindi l'interfaccia deve sembrare *fatta a mano, storta e sicura di sé*, mai pulita in modo corporate.

Le tre leggi:

1. **Niente è perfettamente dritto.** Ogni card, sticker e punchline ha una micro-rotazione (da ±0.4° a ±3°). La rotazione si *raddrizza* al hover: il caos è intenzionale e risponde all'utente. Unica eccezione: la pagina **Pedro**, dove tutto è a 0° di proposito — è "l'unico dritto della famiglia", e la regola infranta diventa una battuta.
2. **Il vetro è sporco.** Glassmorphism sì, ma tintato con colori acidi, bordi tratteggiati, ombre dure. Mai vetro neutro "da dashboard".
3. **La copy è parte della UI.** Ogni stato (loading, errore, vuoto) parla con la voce del gruppo: autoironica, in minuscolo, mai tecnica. "qui non c'è niente — come il ponte sullo stretto" invece di "No results found".

Cosa NON è questo sistema: niente gergo cyber/terminale (`SYSTEM_ERROR`, `[ ACCESS_DATA ]`), niente layout simmetrici e ariosi "in stile AI", niente font generici.

---

## 2. Tipografia

Tre font, tre ruoli precisi. Mai mescolare i ruoli.

| Ruolo | Font | Classe Tailwind | Uso |
|---|---|---|---|
| **Display** | Climate Crisis | `font-crisis` | Titoli di pagina e sezione. Ultra-grasso, demenziale. SEMPRE in maiuscolo. Dato il peso enorme, taglie contenute: `text-2xl`–`text-7xl` max. |
| **Pennarello** | Permanent Marker | `font-marker` | Punchline, versi delle canzoni, date, accenti emotivi, micro-copy ironica. SEMPRE in minuscolo, quasi sempre ruotato (`-rotate-1`/`rotate-1`). |
| **Corpo** | Martian Mono | `font-martian` | Testo descrittivo, label, bottoni, metadati. Taglie piccole (`text-[9px]`–`text-base`), tracking largo sulle label (`tracking-[0.2em]`–`[0.35em]`). |

Pattern ricorrente nei titoli — **parola evidenziata a pennarello dentro un titolo display**:

```jsx
<h1 className="font-crisis text-5xl text-white">
  DISCO<span className="font-marker text-green-400 inline-block -rotate-3">grafia</span>
</h1>
```

Legacy (non usare nelle sezioni nuove): Orbitron e Space Mono restano solo nella hero, nel logo e in GlitchText.

Eccezione leggibilità: il corpo degli articoli lunghi del blog di Riba usa `font-serif` — Martian Mono su 800 parole stanca.

---

## 3. Colore

Base: **nero puro** (`bg-black`), testo bianco/zinco. Sopra, una palette acida dove **ogni colore ha un significato**:

| Colore | Tailwind | Significato |
|---|---|---|
| Verde acido | `green-400` | Identità Gecowave, release, CTA primarie, i gechi |
| Rosso | `red-400` | I temi, errori, il tasto "cancella" |
| Viola | `purple-400` | I personaggi, la lore, il blog di Riba |
| Arancio | `orange-400` | Riba (l'IA caotica) |
| Blu / Ciano | `blue-400` / `cyan-400` | Pedro (l'IA razionale), i messaggi dell'utente in chat |
| Giallo | `yellow-400` | Il podcast |

Regola: **un colore dominante per sezione/pagina**, gli altri compaiono solo come comprimari. La pagina di Riba è arancio, quella di Pedro è blu, il blog è viola — l'utente capisce dove si trova dal colore.

---

## 4. Superfici (il vetro)

Tutte le utility stanno in `src/index.css`.

### `.glass-panel`
La superficie principale: card, modali, contenitori. Blur 24px, saturazione alta, bordo bianco al 9%, ombra profonda + luce interna sul bordo alto. Sempre con raggio generoso: `rounded-2xl`/`rounded-3xl`.

### `.glass-chip`
Versione leggera per chip, citazioni, righe di terminale, bolle chat. Blur 12px.

### `.glass-acid-{green|red|purple|orange|blue|cyan|yellow}`
Tinte da combinare con panel/chip/sticker: gradiente del colore al 10%→2% + bordo colorato al 25%. Esempio: `glass-panel glass-acid-orange`.

### `.sticker`
**La firma del sistema.** Etichetta adesiva: blur, **bordo tratteggiato** bianco al 25%, **ombra dura** `3px 3px 0` (niente sfumatura — sembra attaccata sopra). Si usa per: label di sezione, kicker, bottoni, tag, badge. Quasi sempre ruotata.

```jsx
<span className="sticker rounded-lg px-5 py-2 font-marker text-sm text-zinc-300 -rotate-2">
  la wave, spiegata male
</span>
```

### `.glass-ambient`
Blob radiale gigante e sfocatissimo (`blur(90px)`) dietro le sezioni: dà profondità al blur dei pannelli ed evita il nero piatto. 1–2 per sezione, colori a tema, animato con `.animate-ambient-drift` (deriva lenta 18s). Va messo a opacità bassissime (`bg-green-500/10`–`/15`).

### `.text-outline` / `.text-outline-acid`
Solo contorno, riempimento trasparente. Per i numeroni fantasma dei capitoli (`01`, `02`…) messi in `font-crisis` a `text-[11rem]`, traboccanti dall'angolo della card. NON funziona sulle emoji (sono glifi colorati): per le emoji watermark usare `opacity-[0.06] grayscale`.

---

## 5. I gechi 🦎

Il brand è un geco, quindi il geco è ovunque, sempre con un ruolo:

- **`<Gecko />`** (`src/components/Gecko.tsx`): SVG custom vista dall'alto, con i polpastrelli. Usa `currentColor` → si colora con `text-{colore}/[0.06–0.10]`. Va usato come **watermark gigante** (anche `w-[60vmin]`), sempre ruotato e spesso tagliato dal bordo. Nella StoryIntro ruota e scala con lo scroll.
- **Emoji 🦎**: elementi piccoli e funzionali — l'indicatore di progresso che "cammina" sulla barra dello scroll, i nodi della timeline, i separatori del ticker, l'invito allo scroll nella hero (ruotato di 180°, a testa in giù).
- **🦖 è di Riba**, non del brand: compare solo nelle sue pagine (titolo, bolle chat, loading "riba sta cercando i suoi appunti…").
- Su Pedro il geco è **dritto** (0°): vedi legge n.1.

---

## 6. Motion

Libreria: **framer-motion**. Tre famiglie di movimento:

### a) Entrate (whileInView)
Standard per ogni card/sezione:

```jsx
initial={{ opacity: 0, y: 40 }}
whileInView={{ opacity: 1, y: 0, rotate: tilt }}   // la rotazione arriva CON l'entrata
viewport={{ once: true, margin: '-60px' }}
transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
```

Nelle griglie, stagger col `delay` indicizzato. `once: true` sempre: niente ri-animazioni allo scroll su.

### b) Hover
- Card: `whileHover={{ rotate: 0, y: -8 }}` — si raddrizza e si alza.
- Sticker/bottoni: `hover:rotate-0 hover:scale-105` via CSS.
- Mai cambiare solo il colore: il movimento È il feedback.

### c) Scroll-driven (la home)
- **StoryIntro**: sezione pin alta `N × 100vh`, dentro uno `sticky top-0 h-screen`. `useScroll` sul contenitore + `useTransform` per crossfade/slide delle frasi (la prima è già visibile, l'ultima non esce mai). Progresso = barra + geco che cammina.
- **StoryChapters**: stack di card `position: sticky` con `top` crescente (`calc(13vh + i * 1.75rem)`) — ogni capitolo si impila sul precedente.

⚠️ **REGOLA CRITICA**: `position: sticky` muore se un antenato ha `overflow-x: hidden` (crea uno scroll container). Tutto il sito usa **`overflow-x: clip`** (html, body e wrapper di pagina via `style={{ overflowX: 'clip' }}`). Non reintrodurre MAI `overflow-x-hidden` sopra una sezione sticky.

Dettaglio framer: i transform di motion (`x`, `rotate`…) sovrascrivono le classi `translate-*` di Tailwind sullo stesso elemento — il centraggio va fatto dentro `style` (`x: '-50%'`), non con `-translate-x-1/2`.

Accessibilità: marquee e blob ambientali si fermano con `prefers-reduced-motion: reduce` (già nel CSS).

---

## 7. Componenti ricorrenti

### Kicker sticker (apertura di ogni pagina/sezione)
Sticker con pallino REC rosso lampeggiante (`.animate-rec-blink`) + label martian in tracking largo:

```jsx
<span className="sticker glass-acid-green rounded-lg inline-flex items-center gap-3 px-5 py-2 -rotate-2">
  <span className="w-2 h-2 rounded-full bg-red-500 animate-rec-blink" />
  <span className="font-martian text-[10px] uppercase tracking-[0.3em] text-green-300">
    cos'è gecowave — rec
  </span>
</span>
```

### Bottoni
Niente componente Button shadcn nelle sezioni nuove. Un bottone è uno **sticker cliccabile**: `sticker glass-acid-{x} rounded-xl px-10 py-4 font-martian text-xs uppercase tracking-[0.25em]`, ruotato, con `hover:rotate-0 hover:scale-105`. Primario = tinta del colore di sezione; secondario = sticker neutro. Le frecce (`ArrowUpRight`) si spostano in diagonale al hover.

### Ticker / marquee
Due righe a velocità diverse in direzioni opposte (`.animate-marquee-left/right`, 55s/65s), contenuto duplicato per il loop, pausa al hover, intera fascia ruotata di -2°. Contenuto: chip sticker tintati con citazioni a pennarello + fonte in martian.

### Punchline
Ogni blocco di contenuto chiude con una battuta in `font-marker`, bianca all'85–90%, ruotata: è la "voce" che commenta. ("esistono davvero. purtroppo.")

### Stati di sistema
- **Loading**: emoji a tema che rimbalza (`animate-bounce`) + frase in martian con `animate-pulse`. Mai spinner.
- **Errore**: `glass-panel glass-acid-red`, titolo pennarello ("segnale perso", "riba non risponde"), dettaglio tecnico piccolo e grigio, CTA sticker per riprovare.
- **Vuoto**: stessa struttura, battuta a tema.

---

## 8. Layout & spaziatura

- Contenuti narrativi: `max-w-3xl`/`max-w-4xl`. Griglie: `max-w-5xl`/`max-w-6xl`.
- Sezioni: `py-20`–`py-32`; le pagine partono con `pt-28 md:pt-36` (header fisso).
- Raggi: `rounded-3xl` per i pannelli, `rounded-lg`–`rounded-xl` per sticker e chip. Mai spigoli vivi nelle sezioni nuove.
- Asimmetria: numeroni e watermark traboccano sempre dai bordi (`-top-10 -right-2`, `overflow-hidden` sulla card).
- Mobile: le taglie scendono di 1–2 step, i tilt restano (sono parte dell'identità), le griglie collassano a 1 colonna.

## 9. Copy — regole di voce

1. Italiano, autoironico, mai tecnico-inglese nelle UI nuove.
2. Le label sticker e le punchline in **minuscolo** (è la voce a pennarello). I titoli display in **MAIUSCOLO**.
3. Ogni microcopy è un'occasione di battuta, ma una sola per blocco: la battuta chiude, non interrompe.
4. Riba scrive in minuscolo con refusi voluti; Pedro scrive corretto e composto. La voce segue il personaggio.

## 10. Checklist per una nuova sezione

- [ ] Colore dominante scelto e coerente con la mappa semantica (§3)
- [ ] Kicker sticker o label pennarello in apertura
- [ ] Titolo `font-crisis` MAIUSCOLO con una parola `font-marker` colorata e storta
- [ ] Superfici `glass-panel` tintate, raggio 3xl, micro-rotazioni alternate
- [ ] 1–2 `glass-ambient` dietro, un geco da qualche parte
- [ ] Entrate `whileInView` con stagger, hover che raddrizza
- [ ] Punchline a pennarello in chiusura
- [ ] Stati loading/errore/vuoto con la voce giusta
- [ ] Nessun `overflow-x: hidden` sopra elementi sticky
