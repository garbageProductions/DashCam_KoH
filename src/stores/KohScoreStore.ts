import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useKohZoneStore } from "./KohZoneStore";
import { useMatchStateStore } from "./MatchStateStore";
import { Teams } from "@/interfaces/StoreInterfaces/MatchInfo";

export type KohMode = "team" | "individual";

// When true, Scoreboard.vue shows KoH scores instead of game scores
export const showKohScores = ref(false);

// Tick every 10ms; award pts proportional to actual elapsed seconds (1 pt/sec/player-advantage)
const TICK_INTERVAL_MS = 10;
const POINTS_PER_SECOND = 1;

export const useKohScoreStore = defineStore("kohScore", () => {
	const mode = ref<KohMode>("team");

	// Team mode scores
	const blueScore = ref(0);
	const redScore = ref(0);

	// Individual mode scores: map of playerID -> score
	const playerScores = ref<Record<number, number>>({});

	// Who is currently on the hill this tick
	const playersOnHill = ref<number[]>([]); // playerIDs

	let tickInterval: ReturnType<typeof setInterval> | null = null;
	let lastTickTime: number = 0;

	const kohZoneStore = useKohZoneStore();
	const matchStore = useMatchStateStore();

	// Start/stop ticker based on whether there's an active zone
	watch(
		() => kohZoneStore.activeZoneId,
		(id) => {
			if (id) {
				startTicker();
			} else {
				stopTicker();
			}
		},
		{ immediate: true }
	);

	function startTicker() {
		if (tickInterval !== null) return;
		lastTickTime = performance.now();
		tickInterval = setInterval(tick, TICK_INTERVAL_MS);
	}

	function stopTicker() {
		if (tickInterval !== null) {
			clearInterval(tickInterval);
			tickInterval = null;
		}
		playersOnHill.value = [];
	}

	function tick() {
		const zone = kohZoneStore.activeZone;
		if (!zone) return;

		const now = performance.now();
		const elapsed = (now - lastTickTime) / 1000; // seconds since last tick
		lastTickTime = now;

		const activePlayers = matchStore.PlayerData.filter((p) => p.isActive && !p.isDead);

		// Find who's on the hill
		const onHill = activePlayers.filter((p) =>
			kohZoneStore.isPlayerOnHill(p.feetPosition, zone)
		);

		playersOnHill.value = onHill.map((p) => p.playerID);

		if (mode.value === "individual") {
			// Only score if exactly 1 player is on the hill
			if (onHill.length === 1) {
				const p = onHill[0];
				playerScores.value[p.playerID] =
					(playerScores.value[p.playerID] ?? 0) + POINTS_PER_SECOND * elapsed;
			}
		} else {
			// Team mode: team with more players scores the difference
			const blueCount = onHill.filter((p) => p.team === Teams.blue).length;
			const redCount = onHill.filter((p) => p.team === Teams.red).length;

			if (blueCount > redCount) {
				blueScore.value += (blueCount - redCount) * POINTS_PER_SECOND * elapsed;
			} else if (redCount > blueCount) {
				redScore.value += (redCount - blueCount) * POINTS_PER_SECOND * elapsed;
			}
			// equal = no points
		}
	}

	function resetScores() {
		blueScore.value = 0;
		redScore.value = 0;
		playerScores.value = {};
		playersOnHill.value = [];
	}

	function setMode(newMode: KohMode) {
		mode.value = newMode;
		resetScores();
	}

	// Sorted leaderboard for individual mode
	function individualLeaderboard() {
		return matchStore.PlayerData.filter((p) => p.isActive)
			.map((p) => ({
				playerID: p.playerID,
				name: p.name || `Player ${p.playerID}`,
				team: p.team,
				score: playerScores.value[p.playerID] ?? 0,
			}))
			.sort((a, b) => b.score - a.score);
	}

	return {
		mode,
		blueScore,
		redScore,
		playerScores,
		playersOnHill,
		setMode,
		resetScores,
		individualLeaderboard,
	};
});
