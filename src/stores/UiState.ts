import { ref } from "vue";

// ── Menu panel visibility ─────────────────────────────────────────────────────
// Module-level so App.vue can toggle it from the keydown listener,
// and MenuPanel.vue reads it without needing its own listener.
export const isMenuOpen = ref(false);

// ── Headshot flash ────────────────────────────────────────────────────────────
// When true, App.vue renders a red border flash over the whole window.
export const headshotFlash = ref(false);

const FLASH_DURATION_MS = 350;
let flashTimeout: ReturnType<typeof setTimeout> | null = null;

export function triggerHeadshotFlash() {
    headshotFlash.value = true;
    if (flashTimeout) clearTimeout(flashTimeout);
    flashTimeout = setTimeout(() => {
        headshotFlash.value = false;
        flashTimeout = null;
    }, FLASH_DURATION_MS);
}
