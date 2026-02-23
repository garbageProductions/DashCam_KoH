import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Teams } from '@/interfaces/StoreInterfaces/MatchInfo';

export interface CaptureEvent {
    id: number;
    point: 'A' | 'B' | 'C';
    fromTeam: Teams;
    toTeam: Teams;
}

export const useDominationTrackerStore = defineStore('dominationTracker', () => {
    // Team totals
    const blueCaptures = ref(0);
    const redCaptures  = ref(0);
    const blueCounters = ref(0);
    const redCounters  = ref(0);

    // Per-point totals
    const pointCaptures = ref<{ A: number; B: number; C: number }>({ A: 0, B: 0, C: 0 });
    const pointCounters = ref<{ A: number; B: number; C: number }>({ A: 0, B: 0, C: 0 });

    const captureLog = ref<CaptureEvent[]>([]);

    let nextId = 0;

    // Internal diffing state (non-reactive)
    let prevA: Teams = Teams.none;
    let prevB: Teams = Teams.none;
    let prevC: Teams = Teams.none;
    let prevIsScoring      = false;
    let prevCountDownTimer = 0;
    let scoringTeam: Teams = Teams.none;

    function onDomination(scores: number[], isScoring: boolean, countDownTimer: number) {
        const a = scores[0] as Teams;
        const b = scores[1] as Teams;
        const c = scores[2] as Teams;

        // Collect which points changed this frame so we can attribute counters
        const changedThisFrame: ('A' | 'B' | 'C')[] = [];
        if (prevA !== a) changedThisFrame.push('A');
        if (prevB !== b) changedThisFrame.push('B');
        if (prevC !== c) changedThisFrame.push('C');

        // Record individual point captures
        if (prevA !== a) recordCapture('A', prevA, a);
        if (prevB !== b) recordCapture('B', prevB, b);
        if (prevC !== c) recordCapture('C', prevC, c);

        // Detect counter: scoring was active but stopped before timer reached 0.
        // The timer counts down from ~5 s; if it still had significant time when scoring
        // stopped, the scoring team was interrupted (countered).
        if (prevIsScoring && !isScoring) {
            if (prevCountDownTimer > 0.3) {
                if (scoringTeam === Teams.blue) blueCounters.value++;
                else if (scoringTeam === Teams.red) redCounters.value++;

                // Attribute the counter to whichever point(s) changed this frame
                for (const pt of changedThisFrame) {
                    pointCounters.value[pt]++;
                }
            }
        }

        // Snapshot timer each tick while scoring
        if (isScoring) {
            prevCountDownTimer = countDownTimer;
            if (!prevIsScoring) {
                // Scoring just started — lock in which team
                scoringTeam = a; // all 3 are the same team when isScoring=true
            }
        }

        prevA         = a;
        prevB         = b;
        prevC         = c;
        prevIsScoring = isScoring;
    }

    function recordCapture(point: 'A' | 'B' | 'C', from: Teams, to: Teams) {
        pointCaptures.value[point]++;
        if (to === Teams.blue) blueCaptures.value++;
        else if (to === Teams.red) redCaptures.value++;

        captureLog.value.unshift({ id: nextId++, point, fromTeam: from, toTeam: to });
        if (captureLog.value.length > 50) captureLog.value.pop();
    }

    function reset() {
        blueCaptures.value = 0;
        redCaptures.value  = 0;
        blueCounters.value = 0;
        redCounters.value  = 0;
        pointCaptures.value = { A: 0, B: 0, C: 0 };
        pointCounters.value = { A: 0, B: 0, C: 0 };
        captureLog.value   = [];
        nextId             = 0;
        prevA              = Teams.none;
        prevB              = Teams.none;
        prevC              = Teams.none;
        prevIsScoring      = false;
        prevCountDownTimer = 0;
        scoringTeam        = Teams.none;
    }

    return {
        blueCaptures,
        redCaptures,
        blueCounters,
        redCounters,
        pointCaptures,
        pointCounters,
        captureLog,
        onDomination,
        reset,
    };
});
