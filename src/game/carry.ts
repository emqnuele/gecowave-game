// mai azzerati in create() e phaser riusa la scena: sopravvivono al restart, bug da sistemare in un commit a parte
export class RestartCarry {
    spawnerToastShown = false;
    safeTimer = 0;
    cloneUntil = 0;
    exitLockToastAt = 0;
    lamettaFloorY = 0;
    nextLametteAt = 0;
    nextPitturaAt = 0;
    pattoDeiAt = 0;
    pattoNextSpawnAt = 0;
    chaseLastSeen = { x: 0, y: 0 };
    chaseStartedAt = 0;
    nextIvanStrikeAt = 0;
    parryUntil = 0;
    nextLessonCheck = 0;
}
