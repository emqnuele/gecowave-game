import { Rng } from '../rules/rng';

const draw = (): number => Math.floor(Math.random() * 4294967296) >>> 0;

/** due sequenze: la logica decide cosa succede, il cosmetico solo cosa si vede e si sente. una particella in più non sposta la trama */
export const rng = {
    logic: new Rng(draw()),
    fx: new Rng(draw()),
};

/** a ogni livello le sequenze ripartono da semi pescati dal caso del browser: mai visibili, mai uguali tra due partite */
export function reseedRng(): void {
    rng.logic.reseed(draw());
    rng.fx.reseed(draw());
}
