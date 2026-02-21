<template>
    <div class="koh_board" v-if="kohZoneStore.activeZone && showKohScores">

        <!-- Team mode -->
        <div class="koh_scores" v-if="scoreStore.mode === 'team'">
            <div class="koh_score koh_score--blue">
                <div class="koh_hill_pips">
                    <span v-for="n in blueOnHill" :key="n" class="koh_pip koh_pip--blue" />
                </div>
                <span class="koh_score_val">{{ scoreStore.blueScore.toFixed(3) }}</span>
            </div>

            <div class="koh_center">
                <div class="koh_zone_name">{{ kohZoneStore.activeZone.name }}</div>
                <div class="koh_contested" v-if="isContested">CONTESTED</div>
                <div class="koh_controlled koh_controlled--blue" v-else-if="blueOnHill > redOnHill">BLUE +{{ blueOnHill - redOnHill }}</div>
                <div class="koh_controlled koh_controlled--red" v-else-if="redOnHill > blueOnHill">RED +{{ redOnHill - blueOnHill }}</div>
                <div class="koh_empty" v-else>—</div>
            </div>

            <div class="koh_score koh_score--red">
                <span class="koh_score_val">{{ scoreStore.redScore.toFixed(3) }}</span>
                <div class="koh_hill_pips">
                    <span v-for="n in redOnHill" :key="n" class="koh_pip koh_pip--red" />
                </div>
            </div>
        </div>

        <!-- Individual mode -->
        <div class="koh_individual" v-else>
            <div class="koh_zone_name">{{ kohZoneStore.activeZone.name }}</div>
            <div
                class="koh_ind_row"
                v-for="(entry, i) in topPlayers"
                :key="entry.playerID"
                :class="entry.team === 0 ? 'koh_ind_row--red' : 'koh_ind_row--blue'"
            >
                <span class="koh_ind_rank">#{{ i + 1 }}</span>
                <span class="koh_ind_name">{{ entry.name }}</span>
                <span class="koh_ind_score">{{ entry.score.toFixed(3) }}</span>
            </div>
            <div class="koh_status koh_contested" v-if="isContested">CONTESTED</div>
            <div class="koh_status koh_solo" v-else-if="scoreStore.playersOnHill.length === 1">SCORING</div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useKohZoneStore } from "@/stores/KohZoneStore";
import { useKohScoreStore, showKohScores } from "@/stores/KohScoreStore";
import { useMatchStateStore } from "@/stores/MatchStateStore";
import { Teams } from "@/interfaces/StoreInterfaces/MatchInfo";

const kohZoneStore = useKohZoneStore();
const scoreStore = useKohScoreStore();
const matchStore = useMatchStateStore();

const blueOnHill = computed(() =>
    scoreStore.playersOnHill.filter((id) => {
        const p = matchStore.PlayerData.find((p) => p.playerID === id);
        return p?.team === Teams.blue;
    }).length
);

const redOnHill = computed(() =>
    scoreStore.playersOnHill.filter((id) => {
        const p = matchStore.PlayerData.find((p) => p.playerID === id);
        return p?.team === Teams.red;
    }).length
);

const isContested = computed(() =>
    scoreStore.playersOnHill.length >= 2 &&
    blueOnHill.value === redOnHill.value
);

const topPlayers = computed(() =>
    scoreStore.individualLeaderboard().slice(0, 5)
);
</script>

<style scoped lang="scss">
.koh_board {
    position: fixed;
    top: 120px; // sits just below the scoreboard/timer area
    left: 50%;
    transform: translateX(-50%);
    z-index: 4;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.koh_zone_name {
    font-size: 0.65em;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 0.06em;
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 0.2em;
}

// ── Team mode
.koh_scores {
    display: flex;
    align-items: center;
    gap: 0.6em;
}

.koh_score {
    display: flex;
    align-items: center;
    gap: 0.35em;
}

.koh_score_val {
    font-size: 1.6em;
    font-weight: 800;
    font-family: monospace;
    min-width: 4ch;
    text-align: center;
}

.koh_score--blue .koh_score_val { color: #72aeff; }
.koh_score--red  .koh_score_val { color: #ff7272; }

.koh_hill_pips {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.koh_pip {
    display: block;
    width: 7px;
    height: 7px;
    border-radius: 50%;

    &.koh_pip--blue {
        background: #72aeff;
        box-shadow: 0 0 4px #72aeff;
    }

    &.koh_pip--red {
        background: #ff7272;
        box-shadow: 0 0 4px #ff7272;
    }
}

.koh_center {
    min-width: 80px;
    text-align: center;
    font-size: 0.65em;
    font-weight: 800;
    letter-spacing: 0.08em;
}

.koh_contested {
    color: #f90;
    animation: flicker 0.8s ease-in-out infinite;
}

.koh_controlled--blue { color: #72aeff; }
.koh_controlled--red  { color: #ff7272; }
.koh_empty            { color: rgba(255, 255, 255, 0.25); }

@keyframes flicker {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.4; }
}

// ── Individual mode
.koh_individual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2em;
    width: 260px;
}

.koh_ind_row {
    display: flex;
    align-items: center;
    gap: 0.5em;
    width: 100%;
    padding: 0.15em 0.5em;
    border-radius: 3px;
    font-size: 0.72em;

    &.koh_ind_row--blue {
        border-left: 3px solid #72aeff;
        background: rgba(0, 69, 255, 0.18);
    }

    &.koh_ind_row--red {
        border-left: 3px solid #ff7272;
        background: rgba(255, 0, 0, 0.18);
    }
}

.koh_ind_rank {
    color: rgba(255, 255, 255, 0.35);
    min-width: 1.5em;
}

.koh_ind_name {
    flex: 1;
    color: #fff;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.koh_ind_score {
    font-weight: 800;
    font-family: monospace;
    color: rgba(255, 255, 255, 0.85);
}

.koh_status {
    font-size: 0.65em;
    font-weight: 800;
    letter-spacing: 0.1em;
    margin-top: 0.2em;
}

.koh_solo {
    color: #0c6;
    animation: flicker 1s ease-in-out infinite;
}
</style>
