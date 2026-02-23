import {
	DashCamSettings,
	iconModes,
	WebsocketStatusTypes,
} from "@/interfaces/StoreInterfaces/StoreState";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useSettingStore = defineStore("settings", () => {
	const WebsocketStatus = ref(WebsocketStatusTypes.disconnected);

	const Version = ref("");
	const IconSettings = ref({
		customBlueIcon: "",
		customRedIcon: "",
		iconMode: iconModes.dashLeague,
	} as DashCamSettings);

	// Team name overrides — null means "Auto" (follow clan-tag detection)
	const redTeamOverride  = ref<string | null>(null);
	const blueTeamOverride = ref<string | null>(null);

	// All unique clan-tag names seen this match, per team
	const redTeamCandidates  = ref<string[]>([]);
	const blueTeamCandidates = ref<string[]>([]);

	return { Version, IconSettings, WebsocketStatus, redTeamOverride, blueTeamOverride, redTeamCandidates, blueTeamCandidates };
});
