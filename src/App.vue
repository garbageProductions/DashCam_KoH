<template>
	<AdminBar @openHelp="() => openHelp = !openHelp" />
	<layout />
	<instructions v-if="openHelp" />
	<versionCheck />
	<MenuPanel />
	<!-- Headshot flash — full-window red border -->
	<div class="headshot_flash" v-if="headshotFlash" />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import Layout from "./components/Layout.vue";
import Instructions from "./components/Instructions.vue";
import versionCheck from "./components/VersionCheck.vue";
import MenuPanel from "./components/MenuPanel.vue";
import { createWebsocketManager } from "./HyperBashLogic/WebsocketManager";
import { useMatchStateStore } from "./stores/MatchStateStore";
import AdminBar from "./components/AdminBar.vue";
import { initStore } from "./HyperBashLogic/HyperBashCalls";
import { isMenuOpen, headshotFlash, triggerHeadshotFlash } from "./stores/UiState";
import { EventKillFeed } from "./HyperBashLogic/HyperBashEvents";

const state = useMatchStateStore();
const openHelp = ref(false);

// ── Right Shift toggles the menu panel ───────────────────────────────────────
function onKeyDown(e: KeyboardEvent) {
	if (e.code === "ShiftRight" && !e.repeat) {
		isMenuOpen.value = !isMenuOpen.value;
	}
}

// ── Headshot flash — subscribe at module level, App is never unmounted ────────
EventKillFeed.subscribe((data) => {
	if (data.headShot) triggerHeadshotFlash();
});

onMounted(() => {
	state.$reset();
	initStore();
	createWebsocketManager();
	// window.focus() ensures OBS browser source receives keyboard events
	window.focus();
	window.addEventListener("keydown", onKeyDown);
});
</script>

<style>
#app {
	font-family: "Roboto", sans-serif;
}

body {
	background: rgba(100, 100, 100, 1);
	margin: 0px;
	padding: 0px;
}

.headshot_flash {
	position: fixed;
	inset: 0;
	pointer-events: none;
	z-index: 9999;
	border: 6px solid #ff1a1a;
	border-radius: 2px;
	box-shadow: inset 0 0 40px rgba(255, 0, 0, 0.45);
	animation: flash_fade 0.35s ease-out forwards;
}

@keyframes flash_fade {
	0%   { opacity: 1; }
	100% { opacity: 0; }
}
</style>
