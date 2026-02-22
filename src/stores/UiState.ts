import { ref } from "vue";

// ── Menu panel visibility ─────────────────────────────────────────────────────
export const isMenuOpen = ref(false);

// ── Headshot flash ────────────────────────────────────────────────────────────
export const headshotFlashEnabled = ref(true);
export const headshotFlash = ref(false);

const FLASH_DURATION_MS = 350;
let flashTimeout: ReturnType<typeof setTimeout> | null = null;

export function triggerHeadshotFlash() {
    if (!headshotFlashEnabled.value) return;
    headshotFlash.value = true;
    if (flashTimeout) clearTimeout(flashTimeout);
    flashTimeout = setTimeout(() => {
        headshotFlash.value = false;
        flashTimeout = null;
    }, FLASH_DURATION_MS);
}
