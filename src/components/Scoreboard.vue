<template>
	<div class="scoreboard">
		<div class="scoreboard_wrapper">
			<div class="scoreboard_name scoreboard_name--blue">{{ state.GetTeamData.blue.name }}</div>
			<div class="scoreboard_score scoreboard_score--blue">
				{{ blueTeamScore }}<span v-if="matchInfo.matchType === MatchType.Payload">%</span>
			</div>
			<div class="scoreboard_mode scoreboard_mode--blue" v-if="matchInfo.matchType">
				<div class="mode mode--blue" :class="matchTypeClass">
					<div class="bars" v-if="matchInfo.matchType === MatchType.ControlPoint">
						<bar :index="Teams.blue" :compare="'='" :value="matchInfo.controlPoint.TeamScoringPoints"
							:width="'100%'" />
					</div>
					<div class="bars" v-else-if="matchInfo.matchType === MatchType.Domination">
						<bar :text="'A'" :index="Teams.blue" :compare="'='" :value="matchInfo.domination.pointA" />
						<bar :text="'B'" :index="Teams.blue" :compare="'='" :value="matchInfo.domination.pointB" />
						<bar :text="'C'" :index="Teams.blue" :compare="'='" :value="matchInfo.domination.pointC" />
					</div>
					<div class="bars" v-else-if="matchInfo.matchType === MatchType.Payload">
						<bar v-for="index in 3" :index="index" :compare="'<='" :value="matchInfo.payload.amountBlueOnCart"
							v-bind:key="index" />
					</div>
				</div>
			</div>
			<div class="scoreboard_time">
				<div>{{ timer }}</div>
			</div>
			<div class="scoreboard_name scoreboard_name--red">{{ state.GetTeamData.red.name }}</div>
			<div class="scoreboard_score scoreboard_score--red">
				{{ redTeamScore }}<span v-if="matchInfo.matchType === MatchType.Payload">%</span>
			</div>
			<div class="scoreboard_mode scoreboard_mode--red">
				<div class="mode mode--red" :class="matchTypeClass">
					<div class="bars" v-if="matchInfo.matchType === MatchType.ControlPoint">
						<bar :value="matchInfo.controlPoint.TeamScoringPoints" :compare="'='" :index="Teams.red"
							:width="'100%'" />
					</div>
					<div class="bars" v-else-if="matchInfo.matchType === MatchType.Domination">
						<bar :text="'A'" :value="matchInfo.domination.pointA" :compare="'='" :index="Teams.red" />
						<bar :text="'B'" :value="matchInfo.domination.pointB" :compare="'='" :index="Teams.red" />
						<bar :text="'C'" :value="matchInfo.domination.pointC" :compare="'='" :index="Teams.red" />
					</div>
					<div class="bars" v-else-if="matchInfo.matchType === MatchType.Payload">
						<bar :value="matchInfo.payload.cartBlockedByRed" :compare="'boolean'" :width="'100%'" />
					</div>
				</div>
			</div>
		</div>
		<!-- CAP tug-of-war bar only visible in control point mode -->
		<div class="dom_tug_rows" v-if="matchInfo.matchType === MatchType.ControlPoint">
			<div class="dom_tug_row">
				<span class="dom_tug_label">CAP</span>
				<span class="dom_tug_num dom_tug_num--blue">{{ cpTracker.blueCaptures }}</span>
				<div class="dom_tug_track">
					<div class="dom_tug_fill dom_tug_fill--blue" :style="{ width: cpBluePercent + '%' }"></div>
					<div class="dom_tug_fill dom_tug_fill--red"  :style="{ width: cpRedPercent  + '%' }"></div>
				</div>
				<span class="dom_tug_num dom_tug_num--red">{{ cpTracker.redCaptures }}</span>
			</div>
		</div>

		<!-- CAP / CTR tug-of-war bars only visible in domination mode -->
		<div class="dom_tug_rows" v-if="matchInfo.matchType === MatchType.Domination">
			<div class="dom_tug_row">
				<span class="dom_tug_label">CAP</span>
				<span class="dom_tug_num dom_tug_num--blue">{{ domTracker.blueCaptures }}</span>
				<div class="dom_tug_track">
					<div class="dom_tug_fill dom_tug_fill--blue" :style="{ width: captureBluePercent + '%' }"></div>
					<div class="dom_tug_fill dom_tug_fill--red"  :style="{ width: captureRedPercent  + '%' }"></div>
				</div>
				<span class="dom_tug_num dom_tug_num--red">{{ domTracker.redCaptures }}</span>
			</div>
			<div class="dom_tug_row">
				<span class="dom_tug_label">CTR</span>
				<span class="dom_tug_num dom_tug_num--blue">{{ domTracker.blueCounters }}</span>
				<div class="dom_tug_track">
					<div class="dom_tug_fill dom_tug_fill--blue" :style="{ width: counterBluePercent + '%' }"></div>
					<div class="dom_tug_fill dom_tug_fill--red"  :style="{ width: counterRedPercent  + '%' }"></div>
				</div>
				<span class="dom_tug_num dom_tug_num--red">{{ domTracker.redCounters }}</span>
			</div>
		</div>
	</div>
</template>

<style scoped lang="css">
.scoreboard {
	display: flex;
	flex-direction: column;
	align-items: center;
	grid-column: 2;
	grid-row: 1;
}

.scoreboard_wrapper {
	background: transparent url('@/assets/dln-ui-scoreboard.png') no-repeat scroll 0 0;
	color: #fff;
	display: grid;
	grid-column-start: 2;
	grid-template-columns: 122px 12px 70px 7px 105px 71px 12px auto;
	grid-template-rows: 17px 9px 29px 11px 4px auto;
	height: 107px;
	margin-top: 1em;
	width: 523px;
}

.scoreboard_wrapper>div {
	align-items: center;
	display: flex;
	justify-content: center;
}

.scoreboard_name {
	font-size: 30px;
	font-weight: 800;
	grid-row: 3 / span 3;
}

.scoreboard_name--blue {
	grid-column: 1;
}

.scoreboard_name--red {
	grid-column: -2;
}

.scoreboard_score {
	font-size: 24px;
	font-weight: 700;
	grid-row: 2 / span 2;
}

.scoreboard_score--blue {
	grid-column: 3 / span 2;
}

.scoreboard_score--red {
	grid-column: 6;
}

.scoreboard_time {
	font-size: 30px;
	font-weight: 800;
	grid-column: 4 / span 2;
	grid-row: 5 / span 2;
	text-align: center;
}

.scoreboard_mode {
	grid-row: 6;
}

.scoreboard_mode--blue {
	grid-column: 1 / span 3;
	justify-content: flex-end !important;
}

.scoreboard_mode--red {
	grid-column: 6 / span 3;
	justify-content: flex-start !important;
}

.bars {
	display: flex;
	flex-direction: row;
	height: 21px;
	justify-content: space-between;
	position: relative;
	width: 102px;
}

.mode--controlpoint .bars {
	width: 51px;
}

.mode--domination .bars {
	flex-direction: row;
	height: 28px;
}

.mode--blue {
	padding-right: 22px;
}

.mode--blue.mode--domination {
	padding-right: 28px;
}

.mode--blue.mode--payload .bars {
	flex-direction: row-reverse;
}

.mode--red {
	padding-left: 22px;
}

.mode--red.mode--domination {
	padding-left: 28px;
}


.dom_tug_rows {
	display: flex;
	flex-direction: column;
	gap: 3px;
	width: 640px;
	padding: 4px 0 0;
}

.dom_tug_row {
	display: flex;
	align-items: center;
	gap: 5px;
}

.dom_tug_label {
	font-size: 11px;
	font-weight: 900;
	font-family: monospace;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #fff;
	background: rgba(0,0,0,0.75);
	border: 1px solid rgba(255,255,255,0.65);
	border-radius: 3px;
	padding: 1px 5px;
	flex-shrink: 0;
	text-align: center;
}

.dom_tug_num {
	font-size: 13px;
	font-weight: 900;
	font-family: monospace;
	min-width: 16px;
	text-align: center;
	line-height: 1;
	text-shadow: 0 0 4px rgba(0,0,0,0.8), 1px 1px 0 #000, -1px -1px 0 #000;
}

.dom_tug_num--blue { color: #72b4ff; text-align: right; }
.dom_tug_num--red  { color: #ff9090; text-align: left; }

.dom_tug_track {
	flex: 1;
	height: 5px;
	background: rgba(255,255,255,0.08);
	border-radius: 3px;
	position: relative;
	overflow: hidden;
}

.dom_tug_fill {
	position: absolute;
	top: 0;
	bottom: 0;
	transition: width 0.35s ease;
}

.dom_tug_fill--blue {
	left: 0;
	background: linear-gradient(to right, rgba(0,60,220,0.9), rgba(90,160,255,0.7));
}

.dom_tug_fill--red {
	right: 0;
	background: linear-gradient(to left, rgba(180,0,0,0.9), rgba(255,90,90,0.7));
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { AnnouncerTypes, MatchType, Teams } from "@/interfaces/StoreInterfaces/MatchInfo";
import Bar from "./Bar.vue";
import { useMatchStateStore } from "@/stores/MatchStateStore";
import { useKohScoreStore, showKohScores } from "@/stores/KohScoreStore";
import { useDominationTrackerStore } from "@/stores/DominationTrackerStore";
import { useControlPointTrackerStore } from "@/stores/ControlPointTrackerStore";
import { EventAnnouncer } from "@/HyperBashLogic/HyperBashEvents";
import { AnnouncerLayout } from "@/interfaces/HyperBashMessages.interface";
import { PlayerStateInfo } from "@/interfaces/StoreInterfaces/StoreState";

const kohScore   = useKohScoreStore();
const domTracker = useDominationTrackerStore();
const cpTracker  = useControlPointTrackerStore();

const cpBluePercent = computed(() => {
	const total = cpTracker.blueCaptures + cpTracker.redCaptures;
	return total === 0 ? 0 : (cpTracker.blueCaptures / total) * 100;
});
const cpRedPercent = computed(() => {
	const total = cpTracker.blueCaptures + cpTracker.redCaptures;
	return total === 0 ? 0 : (cpTracker.redCaptures / total) * 100;
});

const captureBluePercent = computed(() => {
	const total = domTracker.blueCaptures + domTracker.redCaptures;
	return total === 0 ? 0 : (domTracker.blueCaptures / total) * 100;
});
const captureRedPercent = computed(() => {
	const total = domTracker.blueCaptures + domTracker.redCaptures;
	return total === 0 ? 0 : (domTracker.redCaptures / total) * 100;
});
const counterBluePercent = computed(() => {
	const total = domTracker.blueCounters + domTracker.redCounters;
	return total === 0 ? 0 : (domTracker.blueCounters / total) * 100;
});
const counterRedPercent = computed(() => {
	const total = domTracker.blueCounters + domTracker.redCounters;
	return total === 0 ? 0 : (domTracker.redCounters / total) * 100;
});

const state = useMatchStateStore();
let customTimer = ref(0);
let intervalReference: number = -1;

onMounted(() => {
	EventAnnouncer.subscribe(onAnnouncer)
})

const blueTeamScore = computed(() => {
	if (showKohScores.value) return Math.floor(kohScore.blueScore * 100) / 100;

	if (state.GetMatchInfo.matchType == MatchType.Payload) {
		if (state.GetMatchInfo.payload.precisePayloadDistance) {
			let number = state.GetMatchInfo.payload.precisePayloadDistance;
			number *= 100;
			return number.toFixed(2);
		}
	}
	else if (state.GetMatchInfo.matchType == MatchType.Deathmatch){
		var teamSort = state.PlayerData
			.filter((e: PlayerStateInfo) => e.isActive == true)
			.sort((p1: PlayerStateInfo, p2: PlayerStateInfo) => p2.kills - p1.kills);

		return teamSort[0].kills;
	}

	return state.GetMatchInfo.blueScore ? state.GetMatchInfo.blueScore : 0;
})

const redTeamScore = computed(() => {
	if (showKohScores.value) return Math.floor(kohScore.redScore * 100) / 100;

	if(state.GetMatchInfo.matchType == MatchType.Deathmatch){
		var teamSort = state.PlayerData
			.filter((e: PlayerStateInfo) => e.isActive == true)
			.sort((p1: PlayerStateInfo, p2: PlayerStateInfo) => p2.kills - p1.kills);

		return teamSort[1].kills;
	}

	return state.GetMatchInfo.redScore ? state.GetMatchInfo.redScore : 0;
})

const matchTypeClass = computed(() => {
	var mode = MatchType[state.GetMatchInfo.matchType] !== undefined ? MatchType[state.GetMatchInfo.matchType].toLowerCase() : false;
	
	return mode ? 'mode--' + mode : '';
})

function onAnnouncer(socketData: AnnouncerLayout) {
	if (socketData.message == AnnouncerTypes.match_start_321) {
		customTimer.value = 5;
	}
	else if (socketData.message == AnnouncerTypes.prepare_to_start) {
		customTimer.value = 26;
		if(state.MatchInfo.matchType == MatchType.Domination){
			if(state.MatchInfo.redScore > 0 || state.MatchInfo.blueScore > 0){
				customTimer.value = 0; // Doors don't lock at domination second round
			}
		}
	}
	else if(socketData.message == AnnouncerTypes.match_start_321_go){
		customTimer.value = 4.5;
	}

	if (customTimer.value > 0) {
		clearInterval(intervalReference);
		intervalReference = setInterval(() => {
			customTimer.value -= 0.1;
			if (customTimer.value < -1) {
				clearInterval(intervalReference);
			}
		}, 100)
	}
}

const timer = computed(() => {
	if (matchInfo.value.matchType == MatchType.Domination &&
		matchInfo.value.domination.teamCountDown != Teams.none
	) {
		return matchInfo.value.domination.countDownTimer.toPrecision(3);
	}

	var time: number = customTimer.value > 0 ? customTimer.value : state.GetMatchInfo.timer;

	let date = new Date(0),
		mill = time % 1,
		mins = (time - mill) / 60,
		secs = mins % 1;

	mins = mins - secs;
	secs = secs * 60;

	date.setMinutes(mins);
	date.setSeconds(secs, mill);

	var timeString = date.toLocaleTimeString('en-uk').substr(3,5);

	return timeString;
})
const matchInfo = computed(() => {
	return state.GetMatchInfo;
})
</script>