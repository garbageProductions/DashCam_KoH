import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { EventKillFeed, EventMatchStart } from "@/HyperBashLogic/HyperBashEvents";
import { useMatchStateStore } from "./MatchStateStore";
import { getWeaponIcon, WeaponTypes } from "@/Util/UtilFunctions";

// ── Data shapes ───────────────────────────────────────────────────────────────

export interface KillEvent {
    id: number;                 // monotonic sequence number
    wallTime: number;           // performance.now() at time of kill
    killerID: number;
    killerName: string;
    killerTeam: number;
    victimID: number;
    victimName: string;
    victimTeam: number;
    weaponType: number;         // WeaponTypes enum value
    weaponIcon: string;         // resolved SVG data URL
    weaponName: string;         // human-readable label
    headShot: boolean;
    isAltFire: boolean;
    killStreak: number;
}

// Aggregated matchup: playerA killed/was-killed-by playerB with a given weapon
export interface KillMatchup {
    opponentID: number;
    opponentName: string;
    opponentTeam: number;
    weaponType: number;
    weaponIcon: string;
    weaponName: string;
    headShot: boolean;          // true if ANY kill in this bucket was a headshot
    count: number;
}

// ── Weapon name labels ────────────────────────────────────────────────────────
const WEAPON_LABELS: Record<number, string> = {
    [-1]: "Suicide",
    [WeaponTypes.DefaultPistol]: "Pistol",
    [WeaponTypes.Uzi]: "SMG",
    [WeaponTypes.Rocket]: "Rocket",
    [WeaponTypes.Confetti]: "Confetti",
    [WeaponTypes.FoamHand]: "Foam Hand",
    [WeaponTypes.Cup]: "Cup",
    [WeaponTypes.Shield]: "Shield",
    [WeaponTypes.Shotgun]: "Shotgun",
    [WeaponTypes.BurstRifle]: "Burst Rifle",
    [WeaponTypes.Sniper]: "Sniper",
    [WeaponTypes.Hand]: "Hand",
    [WeaponTypes.ShockPistol]: "Shock Pistol",
    [WeaponTypes.InstaGib]: "InstaGib",
    [WeaponTypes.Ball]: "Ball",
    [WeaponTypes.Flag]: "Flag",
    [WeaponTypes.Sword]: "Sword",
};

function weaponLabel(type: number, isAltFire: boolean): string {
    const base = WEAPON_LABELS[type] ?? `Weapon ${type}`;
    return isAltFire ? `${base} (alt)` : base;
}

// ── Store ─────────────────────────────────────────────────────────────────────
let _seq = 0;

export const useKillTrackerStore = defineStore("killTracker", () => {
    const matchStore = useMatchStateStore();

    const events = ref<KillEvent[]>([]);

    // Subscribe to kill feed — fires every time a kill happens in-game
    EventKillFeed.subscribe((data) => {
        const killer = matchStore.PlayerData[data.killer];
        const victim = matchStore.PlayerData[data.victim];

        const evt: KillEvent = {
            id: _seq++,
            wallTime: performance.now(),
            killerID: data.killer,
            killerName: killer?.name ?? `Player ${data.killer}`,
            killerTeam: killer?.team ?? -1,
            victimID: data.victim,
            victimName: victim?.name ?? `Player ${data.victim}`,
            victimTeam: victim?.team ?? -1,
            weaponType: data.weaponType,
            weaponIcon: getWeaponIcon(data.weaponType as WeaponTypes, data.isAltFire),
            weaponName: weaponLabel(data.weaponType, data.isAltFire),
            headShot: data.headShot,
            isAltFire: data.isAltFire,
            killStreak: data.killStreak,
        };

        events.value.push(evt);
    });

    // Clear on new match
    EventMatchStart.subscribe(() => {
        events.value = [];
        _seq = 0;
    });

    // ── Derived data ──────────────────────────────────────────────────────────

    // All kills BY a given player (killer = them)
    function killsBy(playerID: number): KillEvent[] {
        return events.value.filter((e) => e.killerID === playerID);
    }

    // All deaths OF a given player (victim = them)
    function deathsOf(playerID: number): KillEvent[] {
        return events.value.filter((e) => e.victimID === playerID);
    }

    // Aggregate kills by a player — group by (opponent, weapon), sorted by count desc
    function killMatchups(playerID: number): KillMatchup[] {
        const kills = killsBy(playerID);
        const map = new Map<string, KillMatchup>();

        for (const e of kills) {
            const key = `${e.victimID}:${e.weaponType}:${e.isAltFire}`;
            const existing = map.get(key);
            if (existing) {
                existing.count++;
                if (e.headShot) existing.headShot = true;
            } else {
                map.set(key, {
                    opponentID: e.victimID,
                    opponentName: e.victimName,
                    opponentTeam: e.victimTeam,
                    weaponType: e.weaponType,
                    weaponIcon: e.weaponIcon,
                    weaponName: e.weaponName,
                    headShot: e.headShot,
                    count: 1,
                });
            }
        }

        return [...map.values()].sort((a, b) => b.count - a.count);
    }

    // Aggregate deaths of a player — group by (opponent, weapon), sorted by count desc
    function deathMatchups(playerID: number): KillMatchup[] {
        const deaths = deathsOf(playerID);
        const map = new Map<string, KillMatchup>();

        for (const e of deaths) {
            const key = `${e.killerID}:${e.weaponType}:${e.isAltFire}`;
            const existing = map.get(key);
            if (existing) {
                existing.count++;
                if (e.headShot) existing.headShot = true;
            } else {
                map.set(key, {
                    opponentID: e.killerID,
                    opponentName: e.killerName,
                    opponentTeam: e.killerTeam,
                    weaponType: e.weaponType,
                    weaponIcon: e.weaponIcon,
                    weaponName: e.weaponName,
                    headShot: e.headShot,
                    count: 1,
                });
            }
        }

        return [...map.values()].sort((a, b) => b.count - a.count);
    }

    // Recent events list (last N, newest first)
    const recentEvents = computed(() =>
        [...events.value].reverse().slice(0, 50)
    );

    // Total kill count for a player
    function totalKills(playerID: number): number {
        return events.value.filter((e) => e.killerID === playerID).length;
    }

    function totalDeaths(playerID: number): number {
        return events.value.filter((e) => e.victimID === playerID).length;
    }

    return {
        events,
        recentEvents,
        killsBy,
        deathsOf,
        killMatchups,
        deathMatchups,
        totalKills,
        totalDeaths,
    };
});
