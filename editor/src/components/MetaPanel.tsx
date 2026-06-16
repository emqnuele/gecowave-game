import { useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import type { LevelScript, ZoneColor } from '@game/types';
import { useEditor } from '@/state/editorStore';
import { serializeLevel } from '@/lib/serialize';
import { saveLevelFile } from '@/lib/api';
import { validateLevel } from '@/lib/validate';

const ZONES: ZoneColor[] = ['green', 'purple', 'orange', 'blue', 'red', 'yellow', 'cyan'];
const SCRIPTS: LevelScript[] = [
    'bus', 'lametta', 'trenbolone', 'caso', 'ruhra', 'tana', 'sorveglianza',
    'cantina', 'ricordi', 'indagine', 'pedro', 'custode', 'galliate', 'marcetti',
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-0.5 block text-[10px] uppercase tracking-wide text-neutral-500">{label}</span>
            {children}
        </label>
    );
}

const inputCls = 'w-full rounded bg-panel-2 px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-acid';

export function MetaPanel() {
    const def = useEditor((s) => s.def);
    const current = useEditor((s) => s.current);
    const files = useEditor((s) => s.files);
    const patchMeta = useEditor((s) => s.patchMeta);
    const resize = useEditor((s) => s.resize);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    if (!def || !current) return <div className="p-3 text-xs text-neutral-600">nessun livello aperto</div>;

    const cols = Math.max(...def.grid.map((r) => r.length), 1);
    const rows = def.grid.length;
    const errors = validateLevel(def);
    const levelIds = files.map((f) => f.def.id);

    const save = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const src = serializeLevel(def, current.exportName);
            await saveLevelFile(current.file, src);
            useEditor.setState({ dirty: false });
            setMsg('salvato ✓');
        } catch (e) {
            setMsg(String(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-full flex-col overflow-y-auto">
            <div className="space-y-2 p-3">
                <Field label="id">
                    <input className={inputCls} value={def.id} onChange={(e) => patchMeta({ id: e.target.value })} />
                </Field>
                <Field label="titolo">
                    <input className={inputCls} value={def.title} onChange={(e) => patchMeta({ title: e.target.value })} />
                </Field>
                <Field label="parola accento">
                    <input className={inputCls} value={def.accentWord} onChange={(e) => patchMeta({ accentWord: e.target.value })} />
                </Field>
                <Field label="punchline">
                    <input className={inputCls} value={def.punchline} onChange={(e) => patchMeta({ punchline: e.target.value })} />
                </Field>
                <Field label="zona / colore">
                    <select className={inputCls} value={def.color} onChange={(e) => patchMeta({ color: e.target.value as ZoneColor })}>
                        {ZONES.map((z) => (
                            <option key={z} value={z}>{z}</option>
                        ))}
                    </select>
                </Field>
                <Field label="next (livello successivo)">
                    <select className={inputCls} value={def.next ?? ''} onChange={(e) => patchMeta({ next: e.target.value || undefined })}>
                        <option value="">— nessuno —</option>
                        {levelIds.map((id) => (
                            <option key={id} value={id}>{id}</option>
                        ))}
                    </select>
                </Field>
                <Field label="script speciale">
                    <select className={inputCls} value={def.script ?? ''} onChange={(e) => patchMeta({ script: (e.target.value || undefined) as LevelScript | undefined })}>
                        <option value="">— nessuno —</option>
                        {SCRIPTS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </Field>
                <Field label="intro dialogue (id)">
                    <input className={inputCls} value={def.introDialogue ?? ''} onChange={(e) => patchMeta({ introDialogue: e.target.value || undefined })} />
                </Field>
                <Field label="ambient note">
                    <input
                        type="number"
                        className={inputCls}
                        value={def.ambientNote ?? ''}
                        onChange={(e) => patchMeta({ ambientNote: e.target.value === '' ? undefined : Number(e.target.value) })}
                    />
                </Field>
                <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={!!def.secret} onChange={(e) => patchMeta({ secret: e.target.checked || undefined })} />
                    capitolo segreto
                </label>

                <div className="mt-3 border-t border-line pt-3">
                    <span className="mb-1 block text-[10px] uppercase tracking-wide text-neutral-500">dimensioni griglia</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            className={inputCls}
                            value={cols}
                            onChange={(e) => resize(Math.max(1, Number(e.target.value)), rows)}
                        />
                        <span className="text-neutral-600">×</span>
                        <input
                            type="number"
                            className={inputCls}
                            value={rows}
                            onChange={(e) => resize(cols, Math.max(1, Number(e.target.value)))}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-auto border-t border-line p-3">
                {errors.length > 0 && (
                    <div className="mb-2 space-y-1">
                        {errors.map((e) => (
                            <div key={e} className="flex items-start gap-1 text-[11px] text-orange-400">
                                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                {e}
                            </div>
                        ))}
                    </div>
                )}
                <button
                    onClick={save}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded bg-acid py-2 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50"
                >
                    <Save size={16} />
                    {saving ? 'salvataggio…' : `salva ${current.file}`}
                </button>
                {msg && <p className="mt-2 text-center text-[11px] text-neutral-400">{msg}</p>}
            </div>
        </div>
    );
}
