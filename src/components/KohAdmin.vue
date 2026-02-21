<template>
    <div class="modal">
        <div class="modal_wrapper">

            <!-- Header -->
            <div class="modal_header">
                <h1>King of the Hill</h1>
                <button class="close_btn" @click="$emit('close')">✕</button>
            </div>

            <!-- Tab bar -->
            <div class="tab_bar">
                <button
                    class="tab_btn"
                    :class="{ 'tab_btn--active': activeTab === 'zones' }"
                    @click="activeTab = 'zones'"
                >Zones</button>
                <button
                    class="tab_btn"
                    :class="{ 'tab_btn--active': activeTab === 'edit', 'tab_btn--editing': !!editingId }"
                    @click="activeTab = 'edit'"
                >{{ editingId ? '✏ Edit Zone' : '+ Add Zone' }}</button>
                <button
                    class="tab_btn"
                    :class="{ 'tab_btn--active': activeTab === 'scoring' }"
                    @click="activeTab = 'scoring'"
                >Scoring</button>
            </div>

            <!-- ── TAB: Zones ─────────────────────────────────────── -->
            <div class="tab_content" v-show="activeTab === 'zones'">

                <div class="filter_row">
                    <label for="mapFilter">Map:</label>
                    <select id="mapFilter" v-model="filterMap">
                        <option value="">All</option>
                        <option v-for="name in kohStore.uniqueMapNames()" :key="name" :value="name">{{ name }}</option>
                    </select>
                </div>

                <div class="active_zone_bar" v-if="kohStore.activeZone">
                    <span class="active_label">ACTIVE</span>
                    <span class="active_name">{{ kohStore.activeZone.name }}</span>
                    <button class="btn_clear_active" @click="kohStore.setActiveZone(null)">Clear</button>
                </div>

                <div class="zone_list" v-if="filteredZones.length > 0">
                    <div
                        class="zone_entry"
                        :class="{ 'zone_entry--active': zone.id === kohStore.activeZoneId }"
                        v-for="zone in filteredZones"
                        :key="zone.id"
                    >
                        <img
                            v-if="zone.imageDataUrl"
                            :src="zone.imageDataUrl"
                            class="zone_thumb"
                            alt="zone map"
                        />
                        <div class="zone_thumb zone_thumb--placeholder" v-else>?</div>

                        <div class="zone_info">
                            <span class="zone_name">{{ zone.name }}</span>
                            <span class="zone_map">{{ zone.mapName }}</span>
                            <span class="zone_coords">
                                X:{{ zone.centerX.toFixed(1) }}
                                Y:{{ zone.centerY.toFixed(1) }}
                                Z:{{ zone.centerZ.toFixed(1) }}
                                &nbsp;|&nbsp;
                                {{ zone.width }}×{{ zone.depth }}×{{ zone.robotHeight * 2 }}u
                            </span>
                        </div>

                        <div class="zone_actions">
                            <button
                                class="btn_activate"
                                :class="{ 'btn_activate--on': zone.id === kohStore.activeZoneId }"
                                @click="kohStore.setActiveZone(zone.id === kohStore.activeZoneId ? null : zone.id)"
                            >{{ zone.id === kohStore.activeZoneId ? '★ Active' : '☆ Set' }}</button>
                            <button @click="editZone(zone)">Edit</button>
                            <button class="btn_delete" @click="confirmDelete(zone.id)">Del</button>
                        </div>
                    </div>
                </div>
                <p class="empty_msg" v-else>No zones yet — go to <strong>+ Add Zone</strong> to create one.</p>
            </div>

            <!-- ── TAB: Add / Edit Zone ───────────────────────────── -->
            <div class="tab_content" v-show="activeTab === 'edit'">

                <div class="form_row">
                    <label>Zone Name</label>
                    <input type="text" v-model="form.name" placeholder="e.g. Center Hill" />
                </div>

                <div class="form_row">
                    <label>Map Name</label>
                    <input type="text" v-model="form.mapName" placeholder="e.g. Stadium" />
                </div>

                <!-- Player capture -->
                <div class="subsection">
                    <p class="subsection_label">Get center from player (in-game)</p>
                    <div class="form_row">
                        <label>Player</label>
                        <select v-model="selectedPlayerIndex">
                            <option value="-1" disabled>Select player</option>
                            <option
                                v-for="(player, idx) in activePlayers"
                                :key="idx"
                                :value="player.playerID"
                            >
                                {{ player.name || `Player ${player.playerID}` }}
                            </option>
                        </select>
                        <button
                            @click="capturePlayerPosition"
                            :disabled="selectedPlayerIndex === -1 || activePlayers.length === 0"
                        >Capture</button>
                    </div>
                    <p class="hint" v-if="activePlayers.length === 0">No active players connected.</p>
                </div>

                <!-- Manual Unity entry -->
                <div class="subsection">
                    <p class="subsection_label">Or enter manually (Unity coords)</p>
                    <div class="form_row form_row--coords">
                        <label>X</label>
                        <input type="number" v-model.number="form.centerX" step="0.01" />
                        <label>Y</label>
                        <input type="number" v-model.number="form.centerY" step="0.01" />
                        <label>Z</label>
                        <input type="number" v-model.number="form.centerZ" step="0.01" />
                    </div>
                </div>

                <!-- Dimensions -->
                <div class="subsection">
                    <p class="subsection_label">Zone dimensions</p>
                    <div class="form_row form_row--dims">
                        <label>Width</label>
                        <input type="number" v-model.number="form.width" min="0.1" step="0.5" />
                        <label>Depth</label>
                        <input type="number" v-model.number="form.depth" min="0.1" step="0.5" />
                        <label>Height</label>
                        <select v-model.number="form.robotHeight">
                            <option v-for="h in 5" :key="h" :value="h">{{ h }} ({{ h * 2 }}u)</option>
                        </select>
                    </div>
                </div>

                <!-- Image upload -->
                <div class="subsection">
                    <p class="subsection_label">Map image (optional)</p>
                    <div class="image_upload_area">
                        <input
                            type="file"
                            accept="image/*"
                            ref="fileInputRef"
                            @change="handleImageUpload"
                        />
                        <img
                            v-if="form.imageDataUrl"
                            :src="form.imageDataUrl"
                            class="image_preview"
                            alt="zone preview"
                        />
                        <button v-if="form.imageDataUrl" class="btn_clear_img" @click="form.imageDataUrl = ''">Remove</button>
                    </div>
                    <p class="hint warn" v-if="imageSizeWarning">Image is large (&gt;500KB). Consider a smaller file.</p>
                </div>

                <!-- Actions -->
                <div class="form_actions">
                    <div class="form_actions_left">
                        <button class="btn_save" @click="saveZone">{{ editingId ? 'Update Zone' : 'Add Zone' }}</button>
                        <button v-if="editingId" @click="cancelEdit">Cancel</button>
                    </div>
                    <button class="btn_export" @click="exportJson">Export JSON</button>
                </div>
                <p class="export_notice" v-if="exportNotice">{{ exportNotice }}</p>
            </div>

            <!-- ── TAB: Scoring ───────────────────────────────────── -->
            <div class="tab_content" v-show="activeTab === 'scoring'">

                <div class="form_row">
                    <label>Mode</label>
                    <select v-model="scoreMode" @change="scoreStore.setMode(scoreMode)">
                        <option value="team">Team</option>
                        <option value="individual">Individual</option>
                    </select>
                </div>

                <div class="form_row">
                    <label>Scoreboard</label>
                    <button
                        class="btn_toggle_scores"
                        :class="{ 'btn_toggle_scores--on': showKohScores }"
                        @click="showKohScores = !showKohScores"
                    >{{ showKohScores ? '★ Showing KoH Scores' : '☆ Show KoH Scores' }}</button>
                </div>

                <div class="score_status" v-if="kohStore.activeZone">
                    <span class="score_status_dot score_status_dot--live"></span>
                    <span>Live — {{ kohStore.activeZone.name }}</span>
                </div>
                <div class="score_status" v-else>
                    <span class="score_status_dot"></span>
                    <span>No active zone — set one in the Zones tab</span>
                </div>

                <div class="score_preview" v-if="scoreMode === 'team'">
                    <div class="score_team score_team--blue">
                        <span class="score_team_label">Blue</span>
                        <span class="score_team_val">{{ scoreStore.blueScore.toFixed(3) }}</span>
                    </div>
                    <div class="score_team score_team--red">
                        <span class="score_team_label">Red</span>
                        <span class="score_team_val">{{ scoreStore.redScore.toFixed(3) }}</span>
                    </div>
                </div>

                <div class="score_leaderboard" v-else>
                    <div
                        class="score_row"
                        v-for="entry in scoreStore.individualLeaderboard()"
                        :key="entry.playerID"
                        :class="entry.team === 0 ? 'score_row--red' : 'score_row--blue'"
                    >
                        <span class="score_row_name">{{ entry.name }}</span>
                        <span class="score_row_pts">{{ entry.score.toFixed(3) }} pts</span>
                    </div>
                </div>

                <button class="btn_reset" @click="scoreStore.resetScores()">Reset Scores</button>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useKohZoneStore } from "@/stores/KohZoneStore";
import { useKohScoreStore, showKohScores, type KohMode } from "@/stores/KohScoreStore";
import { useMatchStateStore } from "@/stores/MatchStateStore";
import type { KohZone } from "@/interfaces/KohZone";

defineEmits<{ close: [] }>();

const kohStore = useKohZoneStore();
const scoreStore = useKohScoreStore();
const matchStore = useMatchStateStore();

const scoreMode = ref<KohMode>(scoreStore.mode);

// ── Active tab ────────────────────────────────────────────────────────────────
const activeTab = ref<'zones' | 'edit' | 'scoring'>('zones');

// ── Filter ────────────────────────────────────────────────────────────────────
const filterMap = ref("");

const filteredZones = computed(() => {
    if (!filterMap.value) return kohStore.zones;
    return kohStore.zones.filter((z) => z.mapName === filterMap.value);
});

// ── Form state ────────────────────────────────────────────────────────────────
const defaultForm = (): Omit<KohZone, "id"> => ({
    name: "",
    mapName: matchStore.MatchInfo.mapName || "",
    centerX: 0,
    centerY: 0,
    centerZ: 0,
    width: 5,
    depth: 5,
    robotHeight: 2,
    imageDataUrl: "",
});

const form = ref(defaultForm());
const editingId = ref<string | null>(null);
const imageSizeWarning = ref(false);
const exportNotice = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);

// ── Player capture ────────────────────────────────────────────────────────────
const selectedPlayerIndex = ref(-1);

const activePlayers = computed(() =>
    matchStore.PlayerData.filter((p) => p.isActive)
);

function capturePlayerPosition() {
    const player = matchStore.PlayerData.find(
        (p) => p.playerID === selectedPlayerIndex.value && p.isActive
    );
    if (!player) return;
    form.value.centerX = parseFloat(player.feetPosition.X.toFixed(3));
    form.value.centerY = parseFloat(player.feetPosition.Y.toFixed(3));
    form.value.centerZ = parseFloat(player.feetPosition.Z.toFixed(3));
}

// ── Image upload ──────────────────────────────────────────────────────────────
function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    imageSizeWarning.value = file.size > 500 * 1024;

    const reader = new FileReader();
    reader.onload = (e) => {
        form.value.imageDataUrl = (e.target?.result as string) ?? "";
    };
    reader.readAsDataURL(file);
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
function saveZone() {
    if (!form.value.name.trim() || !form.value.mapName.trim()) {
        alert("Zone Name and Map Name are required.");
        return;
    }
    if (editingId.value) {
        kohStore.updateZone(editingId.value, { ...form.value });
        editingId.value = null;
    } else {
        kohStore.addZone({ ...form.value });
    }
    resetForm();
    activeTab.value = 'zones'; // jump back to list after save
}

function editZone(zone: KohZone) {
    editingId.value = zone.id;
    form.value = {
        name: zone.name,
        mapName: zone.mapName,
        centerX: zone.centerX,
        centerY: zone.centerY,
        centerZ: zone.centerZ,
        width: zone.width,
        depth: zone.depth,
        robotHeight: zone.robotHeight,
        imageDataUrl: zone.imageDataUrl,
    };
    imageSizeWarning.value = false;
    activeTab.value = 'edit'; // auto-switch to edit tab
}

function cancelEdit() {
    editingId.value = null;
    resetForm();
    activeTab.value = 'zones';
}

function confirmDelete(id: string) {
    if (confirm("Delete this zone?")) {
        kohStore.deleteZone(id);
    }
}

function resetForm() {
    form.value = defaultForm();
    selectedPlayerIndex.value = -1;
    imageSizeWarning.value = false;
    if (fileInputRef.value) fileInputRef.value.value = "";
}

// ── Export ────────────────────────────────────────────────────────────────────
async function exportJson() {
    try {
        await navigator.clipboard.writeText(kohStore.exportJson());
        exportNotice.value = "Copied! Paste into src/data/KohZones.json and commit.";
    } catch {
        exportNotice.value = "Clipboard unavailable. Open DevTools console: " + kohStore.exportJson();
    }
    setTimeout(() => (exportNotice.value = ""), 5000);
}
</script>

<style scoped lang="scss">
.modal {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 6;
    display: flex;
    align-items: stretch;
    pointer-events: none;
    animation: slideIn 0.25s ease-out forwards;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
}

.modal_wrapper {
    pointer-events: all;
    width: 380px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: rgba(15, 15, 25, 0.92);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-left: 1px solid rgba(255, 255, 255, 0.12);
    color: #e8e8e8;
}

// ── Header
.modal_header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.9em 1.2em 0.75em;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    h1 {
        margin: 0;
        font-size: 1em;
        color: #fff;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }
}

.close_btn {
    font-size: 0.9em;
    padding: 0.3em 0.65em;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 3px;

    &:hover {
        background: rgba(255, 80, 80, 0.25);
        color: #fff;
        border-color: rgba(255, 80, 80, 0.4);
    }
}

// ── Tab bar
.tab_bar {
    display: flex;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab_btn {
    flex: 1;
    padding: 0.6em 0.4em;
    font-size: 0.82em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: transparent;
    color: rgba(255, 255, 255, 0.45);
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;

    &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.75);
    }

    &.tab_btn--active {
        color: #fff;
        border-bottom-color: #4d8fff;
        background: rgba(77, 143, 255, 0.08);
    }

    &.tab_btn--editing {
        color: #ffd166;

        &.tab_btn--active {
            border-bottom-color: #ffd166;
            background: rgba(255, 209, 102, 0.08);
        }
    }
}

// ── Tab content
.tab_content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1em 1.2em 1.5em;
}

// ── Filter row
.filter_row {
    display: flex;
    align-items: center;
    gap: 0.5em;
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 0.75em;

    select {
        font-size: 0.9em;
        background: #1a1a2e;
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        padding: 0.2em 0.4em;

        option {
            background: #1a1a2e;
            color: #fff;
        }
    }
}

// ── Active zone bar
.active_zone_bar {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.4em 0.7em;
    margin-bottom: 0.75em;
    background: rgba(0, 200, 100, 0.12);
    border: 1px solid rgba(0, 200, 100, 0.35);
    border-radius: 4px;
    font-size: 0.85em;
}

.active_label {
    font-size: 0.72em;
    letter-spacing: 0.1em;
    color: #0c6;
    font-weight: bold;
}

.active_name {
    flex: 1;
    color: #fff;
    font-weight: bold;
}

.btn_clear_active {
    font-size: 0.75em;
    padding: 0.2em 0.5em;
    background: rgba(255, 255, 255, 0.07) !important;
    border-color: rgba(255, 255, 255, 0.15) !important;
}

// ── Zone list
.zone_list {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
}

.zone_entry {
    display: grid;
    grid-template-columns: 48px 1fr;
    grid-template-rows: auto auto;
    gap: 0.4em 0.6em;
    padding: 0.5em 0.6em;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: border-color 0.15s;
}

.zone_thumb {
    width: 48px;
    height: 48px;
    object-fit: cover;
    border-radius: 3px;
    background: #2a2a3e;
    grid-row: 1 / 2;
    align-self: center;
}

.zone_thumb--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4em;
    color: #555;
}

.zone_info {
    display: flex;
    flex-direction: column;
    gap: 0.15em;
    font-size: 0.85em;
    min-width: 0;
}

.zone_name {
    font-weight: bold;
    font-size: 1em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.zone_map {
    color: rgba(255, 255, 255, 0.5);
}

.zone_coords {
    font-family: monospace;
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.zone_entry--active {
    border-color: rgba(0, 200, 100, 0.45);
    background: rgba(0, 200, 100, 0.07);
}

.zone_actions {
    display: flex;
    gap: 0.4em;
    align-items: center;
    grid-column: 1 / -1;
}

.btn_activate {
    font-size: 0.8em;
    padding: 0.25em 0.5em;
    color: rgba(255, 255, 255, 0.55) !important;

    &.btn_activate--on {
        background: rgba(0, 200, 100, 0.2) !important;
        border-color: rgba(0, 200, 100, 0.55) !important;
        color: #0c6 !important;
    }
}

.btn_delete {
    background: rgba(180, 30, 30, 0.5) !important;
    border-color: rgba(200, 60, 60, 0.5) !important;
    color: #ffaaaa !important;
}

.empty_msg {
    color: rgba(255, 255, 255, 0.35);
    font-style: italic;
    font-size: 0.9em;
    text-align: center;
    padding: 1.5em 0;

    strong {
        color: rgba(255, 255, 255, 0.6);
        font-style: normal;
    }
}

// ── Form
.form_row {
    display: flex;
    align-items: center;
    gap: 0.6em;
    margin-bottom: 0.75em;

    label {
        min-width: 78px;
        font-weight: 600;
        font-size: 0.88em;
        color: rgba(255, 255, 255, 0.7);
    }

    input[type="text"],
    input[type="number"],
    select {
        flex: 1;
        font-size: 0.95em;
        padding: 0.35em 0.45em;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 3px;
        background: #1a1a2e;
        color: #fff;
    }

    select option {
        background: #1a1a2e;
        color: #fff;
    }

    input[type="file"] {
        color: rgba(255, 255, 255, 0.65);
        font-size: 0.88em;
    }
}

.form_row--coords {
    flex-wrap: wrap;
    gap: 0.35em;

    label {
        min-width: unset;
        width: auto;
    }

    input[type="number"] {
        width: 68px;
        flex: unset;
    }
}

.form_row--dims {
    flex-wrap: wrap;
    gap: 0.35em;

    label {
        min-width: unset;
        width: auto;
    }

    input[type="number"] {
        width: 58px;
        flex: unset;
    }

    select {
        flex: unset;
        min-width: 108px;
    }
}

.subsection {
    border-left: 2px solid rgba(255, 255, 255, 0.12);
    padding-left: 0.85em;
    margin-bottom: 1.1em;
}

.subsection_label {
    font-size: 0.76em;
    color: rgba(255, 255, 255, 0.38);
    margin: 0 0 0.55em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.hint {
    font-size: 0.8em;
    color: rgba(255, 255, 255, 0.38);
    margin: 0.2em 0 0;
}

.hint.warn {
    color: #f90;
}

.image_upload_area {
    display: flex;
    align-items: center;
    gap: 0.75em;
    flex-wrap: wrap;
}

.image_preview {
    width: 90px;
    height: 90px;
    object-fit: cover;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn_clear_img {
    font-size: 0.8em;
    padding: 0.2em 0.5em;
}

.form_actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.2em;
}

.form_actions_left {
    display: flex;
    gap: 0.5em;
}

.btn_save {
    background: #0045ff !important;
    color: #fff !important;
    border: none !important;
    padding: 0.5em 1.2em;
    font-size: 0.95em;
    border-radius: 3px;
    cursor: pointer;

    &:hover {
        background: #0030cc !important;
    }
}

.btn_export {
    background: rgba(255, 255, 255, 0.1) !important;
    color: rgba(255, 255, 255, 0.7) !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    padding: 0.5em 1em;
    font-size: 0.88em;

    &:hover {
        background: rgba(255, 255, 255, 0.18) !important;
        color: #fff !important;
    }
}

.export_notice {
    margin-top: 0.5em;
    font-size: 0.82em;
    color: #4f4;
}

// ── Scoring tab
.score_status {
    display: flex;
    align-items: center;
    gap: 0.5em;
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.45);
    margin-bottom: 0.9em;
}

.score_status_dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
    flex-shrink: 0;

    &.score_status_dot--live {
        background: #0c6;
        box-shadow: 0 0 6px #0c6;
        animation: pulse 1.5s ease-in-out infinite;
    }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
}

.score_preview {
    display: flex;
    gap: 1em;
    margin-bottom: 0.9em;
}

.score_team {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75em 0.5em;
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.score_team--blue {
    background: rgba(0, 69, 255, 0.18);
    border-color: rgba(114, 174, 255, 0.25);
}

.score_team--red {
    background: rgba(255, 0, 0, 0.18);
    border-color: rgba(255, 114, 114, 0.25);
}

.score_team_label {
    font-size: 0.72em;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 0.25em;
}

.score_team_val {
    font-size: 1.9em;
    font-weight: 800;
    font-family: monospace;
    color: #fff;
}

.score_leaderboard {
    display: flex;
    flex-direction: column;
    gap: 0.3em;
    margin-bottom: 0.9em;
}

.score_row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.3em 0.6em;
    border-radius: 3px;
    font-size: 0.88em;

    &.score_row--blue {
        background: rgba(0, 69, 255, 0.13);
        border-left: 3px solid #72aeff;
    }

    &.score_row--red {
        background: rgba(255, 0, 0, 0.13);
        border-left: 3px solid #ff7272;
    }
}

.score_row_name { color: #fff; }

.score_row_pts {
    font-weight: bold;
    color: rgba(255, 255, 255, 0.75);
    font-family: monospace;
}

.btn_toggle_scores {
    flex: 1;
    text-align: left;

    &.btn_toggle_scores--on {
        background: rgba(0, 200, 100, 0.18) !important;
        border-color: rgba(0, 200, 100, 0.45) !important;
        color: #0c6 !important;
    }
}

.btn_reset {
    background: rgba(180, 40, 40, 0.3) !important;
    border-color: rgba(200, 60, 60, 0.45) !important;
    color: #ffaaaa !important;
    font-size: 0.85em;
}

// ── Global button base
button {
    background: rgba(255, 255, 255, 0.09);
    color: #e8e8e8;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 3px;
    padding: 0.3em 0.7em;
    cursor: pointer;
    font-size: 0.88em;
    transition: background 0.12s;

    &:hover {
        background: rgba(255, 255, 255, 0.18);
    }
}

button:disabled {
    opacity: 0.28;
    cursor: not-allowed;
}
</style>
