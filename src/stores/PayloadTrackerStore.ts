import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useMatchStateStore } from "./MatchStateStore";
import { MatchType } from "@/interfaces/StoreInterfaces/MatchInfo";

export interface PayloadSample {
    time: number;       // seconds elapsed in this round
    distance: number;   // precisePayloadDistance * 100 (0–100)
    defenderOnCart: boolean; // cartBlockedByRed
}

export interface MapCheckpointData {
    mapName: string;
    checkpointDistance: number; // 0–100, auto-detected or manual
}

const STORAGE_KEY = "payloadCheckpoints";
const CHART_KEY = "payloadChartType";

// Module-level toggle — show/hide the overlay
export const showPayloadOverlay = ref(false);
export const payloadChartType = ref<"line" | "scatter">(
    (localStorage.getItem(CHART_KEY) as "line" | "scatter") ?? "line"
);

watch(payloadChartType, (v) => localStorage.setItem(CHART_KEY, v));

function loadCheckpoints(): MapCheckpointData[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
        return [];
    }
}

function saveCheckpoints(data: MapCheckpointData[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Velocity: slope over last N seconds of samples
const VELOCITY_WINDOW_SEC = 5;

export const usePayloadTrackerStore = defineStore("payloadTracker", () => {
    const matchStore = useMatchStateStore();

    // ── Per-map checkpoint config ─────────────────────────────────────────────
    const checkpoints = ref<MapCheckpointData[]>(loadCheckpoints());

    function getCheckpoint(mapName: string): number | null {
        return checkpoints.value.find((c) => c.mapName === mapName)?.checkpointDistance ?? null;
    }

    function setCheckpoint(mapName: string, distance: number) {
        const existing = checkpoints.value.find((c) => c.mapName === mapName);
        if (existing) {
            existing.checkpointDistance = distance;
        } else {
            checkpoints.value.push({ mapName, checkpointDistance: distance });
        }
        saveCheckpoints(checkpoints.value);
    }

    function removeCheckpoint(mapName: string) {
        checkpoints.value = checkpoints.value.filter((c) => c.mapName !== mapName);
        saveCheckpoints(checkpoints.value);
    }

    // ── Recording state ───────────────────────────────────────────────────────
    // round1 = whichever team pushes first, round2 = the other team
    const round1Samples = ref<PayloadSample[]>([]);
    const round2Samples = ref<PayloadSample[]>([]);

    const isRecording = ref(false);
    const currentRound = ref<1 | 2>(1);
    let roundStartWallTime = 0; // performance.now() when this round began
    const lastCheckpointDistance = ref<number | null>(null);

    // Team names are snapshotted from TeamData on the first payload sample
    // of each round — by then matchStart + playerJoins have both fired and
    // TeamData has the real names. Blue always pushes R1, red always pushes R2
    // (cartBlockedByRed / amountBlueOnCart are fixed-color throughout).
    const round1TeamName = ref<string>("");
    const round2TeamName = ref<string>("");
    let round1NameLocked = false;
    let round2NameLocked = false;

    // ── Auto-detect checkpoint ────────────────────────────────────────────────
    let wasCheckpoint = false;

    // ── Watchers ──────────────────────────────────────────────────────────────
    watch(
        () => matchStore.MatchInfo.matchType,
        (type) => {
            if (type === MatchType.Payload) {
                startRecording();
            } else {
                stopRecording();
            }
        },
        { immediate: true }
    );

    watch(
        () => matchStore.MatchInfo.payload.secondRound,
        (isSecond) => {
            if (isSecond && currentRound.value === 1) {
                // R1 done — red team now pushes (secondRound = sides have swapped).
                // Names were already snapshotted at startRecording() so nothing
                // to update here — just advance the round and reset the clock.
                currentRound.value = 2;
                roundStartWallTime = performance.now();
                wasCheckpoint = false;
            }
        }
    );

    watch(
        () => matchStore.MatchInfo.payload,
        (payload) => {
            if (!isRecording.value) return;

            const elapsed = (performance.now() - roundStartWallTime) / 1000;
            const distance = payload.precisePayloadDistance * 100;

            const sample: PayloadSample = {
                time: elapsed,
                distance,
                defenderOnCart: payload.cartBlockedByRed,
            };

            if (currentRound.value === 1) {
                // Lock R1 name on first sample — by now matchStart and
                // playerJoins have both fired so TeamData.blue.name is real.
                if (!round1NameLocked) {
                    round1TeamName.value = matchStore.TeamData.blue.name || "Blue";
                    round2TeamName.value = matchStore.TeamData.red.name  || "Red";
                    round1NameLocked = true;
                }
                // Stop recording once the cart hits 100% — don't let the
                // distance drop back to 0 when the round resets.
                const lastR1 = round1Samples.value[round1Samples.value.length - 1];
                if (!lastR1 || lastR1.distance < 100) {
                    round1Samples.value.push(sample);
                }
            } else {
                // Lock R2 name on first R2 sample (belt-and-suspenders).
                if (!round2NameLocked) {
                    round2TeamName.value = matchStore.TeamData.red.name || "Red";
                    round2NameLocked = true;
                }
                const lastR2 = round2Samples.value[round2Samples.value.length - 1];
                if (!lastR2 || lastR2.distance < 100) {
                    round2Samples.value.push(sample);
                }
            }

            // Auto-detect checkpoint
            if (payload.checkPoint && !wasCheckpoint) {
                wasCheckpoint = true;
                const mapName = matchStore.MatchInfo.mapName;
                if (mapName && getCheckpoint(mapName) === null) {
                    setCheckpoint(mapName, parseFloat(distance.toFixed(1)));
                }
                lastCheckpointDistance.value = distance;
            }
            if (!payload.checkPoint) {
                wasCheckpoint = false;
            }
        },
        { deep: true }
    );

    function startRecording() {
        round1Samples.value = [];
        round2Samples.value = [];
        currentRound.value = 1;
        roundStartWallTime = performance.now();
        isRecording.value = true;
        wasCheckpoint = false;
        lastCheckpointDistance.value = null;
        round1TeamName.value = "";
        round2TeamName.value = "";
        round1NameLocked = false;
        round2NameLocked = false;
    }

    function stopRecording() {
        isRecording.value = false;
    }

    function clearData() {
        round1Samples.value = [];
        round2Samples.value = [];
        lastCheckpointDistance.value = null;
        currentRound.value = 1;
    }

    // ── Velocity computation ──────────────────────────────────────────────────
    // Compute velocity (distance units per second) from last VELOCITY_WINDOW_SEC
    function computeVelocity(samples: PayloadSample[]): number | null {
        if (samples.length < 2) return null;
        const now = samples[samples.length - 1].time;
        const windowStart = now - VELOCITY_WINDOW_SEC;
        const windowed = samples.filter((s) => s.time >= windowStart);
        if (windowed.length < 2) return null;

        const first = windowed[0];
        const last = windowed[windowed.length - 1];
        const dt = last.time - first.time;
        if (dt === 0) return null;
        return (last.distance - first.distance) / dt;
    }

    const round1Velocity = computed(() => computeVelocity(round1Samples.value));
    const round2Velocity = computed(() => computeVelocity(round2Samples.value));

    // ── Active map checkpoint ─────────────────────────────────────────────────
    const activeMapCheckpoint = computed(() => {
        const map = matchStore.MatchInfo.mapName;
        if (!map) return null;
        return getCheckpoint(map);
    });

    return {
        checkpoints,
        round1Samples,
        round2Samples,
        isRecording,
        currentRound,
        lastCheckpointDistance,
        activeMapCheckpoint,
        round1Velocity,
        round2Velocity,
        round1TeamName,
        round2TeamName,
        getCheckpoint,
        setCheckpoint,
        removeCheckpoint,
        startRecording,
        clearData,
    };
});
