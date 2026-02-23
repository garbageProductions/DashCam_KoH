<template>
    <div class="panel" v-if="isMenuOpen">
        <div class="panel_wrapper">

            <!-- Header -->
            <div class="panel_header">
                <h1>DashCam</h1>
                <span class="panel_hint">Right Shift to close</span>
                <button class="close_btn" @click="isMenuOpen = false">✕</button>
            </div>

            <!-- Top-level tabs: Settings | KoH | Payload | Kills -->
            <div class="tab_bar tab_bar--top">
                <button
                    class="tab_btn"
                    :class="{ 'tab_btn--active': topTab === 'settings' }"
                    @click="topTab = 'settings'"
                >⚙ Settings</button>
                <button
                    class="tab_btn"
                    :class="{ 'tab_btn--active': topTab === 'koh' }"
                    @click="topTab = 'koh'"
                >👑 KoH</button>
                <button
                    class="tab_btn"
                    :class="{ 'tab_btn--active': topTab === 'payload' }"
                    @click="topTab = 'payload'"
                >🛒 Payload</button>
                <button
                    class="tab_btn"
                    :class="{ 'tab_btn--active': topTab === 'kills' }"
                    @click="topTab = 'kills'"
                >🔫 Kills</button>
                <button
                    class="tab_btn"
                    :class="{ 'tab_btn--active': topTab === 'dom' }"
                    @click="topTab = 'dom'"
                >🎯 Dom</button>
            </div>

            <!-- ══ SETTINGS TAB ══════════════════════════════════════ -->
            <div class="tab_content" v-show="topTab === 'settings'">
                <div class="section">
                    <h2>Overlays</h2>
                    <label class="toggle_row">
                        <input type="checkbox" v-model="headshotFlashEnabled" />
                        Headshot border flash
                    </label>
                </div>
                <div class="section">
                    <h2>Team Icon</h2>
                    <div id="iconURL">
                        <div class="radio_group">
                            <label>
                                <input type="radio" name="iconURL" v-model="iconURLSetting" value="0" />
                                DashLeague
                            </label>
                            <label>
                                <input type="radio" name="iconURL" v-model="iconURLSetting" value="1" />
                                HyperCup
                            </label>
                            <label>
                                <input type="radio" name="iconURL" v-model="iconURLSetting" value="2" />
                                Custom
                            </label>
                        </div>

                        <div v-if="iconURLSetting == 2" class="custom_icons">
                            <div class="icon_row">
                                <label>Red Team</label>
                                <input type="url" class="inputURL inputRed" v-model="redIconURLSetting" placeholder="https://..." />
                                <img :src="redIconURLSetting" alt="red icon" class="icon_preview" />
                            </div>
                            <div class="icon_row">
                                <label>Blue Team</label>
                                <input type="url" class="inputURL inputBlue" v-model="blueIconURLSetting" placeholder="https://..." />
                                <img :src="blueIconURLSetting" alt="blue icon" class="icon_preview" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ══ KOH TAB ═══════════════════════════════════════════ -->
            <div class="tab_content tab_content--koh" v-show="topTab === 'koh'">

                <!-- KoH sub-tab bar -->
                <div class="tab_bar tab_bar--sub">
                    <button
                        class="tab_btn tab_btn--sub"
                        :class="{ 'tab_btn--active': kohTab === 'zones' }"
                        @click="kohTab = 'zones'"
                    >Zones</button>
                    <button
                        class="tab_btn tab_btn--sub"
                        :class="{ 'tab_btn--active': kohTab === 'edit', 'tab_btn--editing': !!editingId }"
                        @click="kohTab = 'edit'"
                    >{{ editingId ? '✏ Edit Zone' : '+ Add Zone' }}</button>
                    <button
                        class="tab_btn tab_btn--sub"
                        :class="{ 'tab_btn--active': kohTab === 'scoring' }"
                        @click="kohTab = 'scoring'"
                    >Scoring</button>
                </div>

                <!-- ── KoH: Zones ──────────────────────────────────── -->
                <div class="sub_content" v-show="kohTab === 'zones'">

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
                            <img v-if="zone.imageDataUrl" :src="zone.imageDataUrl" class="zone_thumb" alt="zone map" />
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

                <!-- ── KoH: Add / Edit Zone ────────────────────────── -->
                <div class="sub_content" v-show="kohTab === 'edit'">

                    <div class="form_row">
                        <label>Zone Name</label>
                        <input type="text" v-model="form.name" placeholder="e.g. Center Hill" />
                    </div>

                    <div class="form_row">
                        <label>Map Name</label>
                        <input type="text" v-model="form.mapName" placeholder="e.g. Stadium" />
                    </div>

                    <div class="subsection">
                        <p class="subsection_label">Get center from player (in-game)</p>
                        <div class="form_row">
                            <label>Player</label>
                            <select v-model="selectedPlayerIndex">
                                <option value="-1" disabled>Select player</option>
                                <option v-for="(player, idx) in activePlayers" :key="idx" :value="player.playerID">
                                    {{ player.name || `Player ${player.playerID}` }}
                                </option>
                            </select>
                            <button @click="capturePlayerPosition" :disabled="selectedPlayerIndex === -1 || activePlayers.length === 0">Capture</button>
                        </div>
                        <p class="hint" v-if="activePlayers.length === 0">No active players connected.</p>
                    </div>

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

                    <div class="subsection">
                        <p class="subsection_label">Map image (optional)</p>
                        <div class="image_upload_area">
                            <input type="file" accept="image/*" ref="fileInputRef" @change="handleImageUpload" />
                            <img v-if="form.imageDataUrl" :src="form.imageDataUrl" class="image_preview" alt="zone preview" />
                            <button v-if="form.imageDataUrl" class="btn_clear_img" @click="form.imageDataUrl = ''">Remove</button>
                        </div>
                        <p class="hint warn" v-if="imageSizeWarning">Image is large (&gt;500KB). Consider a smaller file.</p>
                    </div>

                    <div class="form_actions">
                        <div class="form_actions_left">
                            <button class="btn_save" @click="saveZone">{{ editingId ? 'Update Zone' : 'Add Zone' }}</button>
                            <button v-if="editingId" @click="cancelEdit">Cancel</button>
                        </div>
                        <button class="btn_export" @click="exportJson">Export JSON</button>
                    </div>
                    <p class="export_notice" v-if="exportNotice">{{ exportNotice }}</p>
                </div>

                <!-- ── KoH: Scoring ────────────────────────────────── -->
                <div class="sub_content" v-show="kohTab === 'scoring'">

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
            <!-- end KoH tab -->

            <!-- ══ PAYLOAD TAB ═══════════════════════════════════════ -->
            <div class="tab_content" v-show="topTab === 'payload'">

                <!-- Status bar -->
                <div class="score_status" v-if="payloadTracker.isRecording">
                    <span class="score_status_dot score_status_dot--live"></span>
                    <span>Recording — Round {{ payloadTracker.currentRound }} — {{ matchStore.MatchInfo.mapName }}</span>
                </div>
                <div class="score_status" v-else>
                    <span class="score_status_dot"></span>
                    <span>Not recording — waiting for Payload match</span>
                </div>

                <!-- Overlay toggle -->
                <div class="form_row">
                    <label>Overlay</label>
                    <button
                        class="btn_toggle_scores"
                        :class="{ 'btn_toggle_scores--on': showPayloadOverlay }"
                        @click="showPayloadOverlay = !showPayloadOverlay"
                    >{{ showPayloadOverlay ? '★ Showing Graph' : '☆ Show Graph' }}</button>
                </div>

                <!-- Chart type -->
                <div class="form_row">
                    <label>Chart Type</label>
                    <div class="chart_type_btns">
                        <button
                            :class="{ 'chart_type_btn--active': payloadChartType === 'line' }"
                            @click="payloadChartType = 'line'"
                        >〜 2D</button>
                        <button
                            :class="{ 'chart_type_btn--active': payloadChartType === 'scatter' }"
                            @click="payloadChartType = 'scatter'"
                        >· · 1D</button>
                    </div>
                </div>

                <!-- Live data summary -->
                <div class="subsection" v-if="payloadTracker.round1Samples.length > 0 || payloadTracker.round2Samples.length > 0">
                    <p class="subsection_label">Live Data</p>
                    <div class="payload_stat_grid">
                        <div class="payload_stat payload_stat--blue">
                            <span class="payload_stat_label">Blue (R1)</span>
                            <span class="payload_stat_val">{{ latestR1Distance }}%</span>
                            <span class="payload_stat_sub">{{ payloadTracker.round1Samples.length }} samples</span>
                            <span class="payload_stat_vel" v-if="payloadTracker.round1ETA !== null">
                                ETA {{ formatETA(payloadTracker.round1ETA) }}
                            </span>
                        </div>
                        <div class="payload_stat payload_stat--red">
                            <span class="payload_stat_label">Red (R2)</span>
                            <span class="payload_stat_val">{{ latestR2Distance }}%</span>
                            <span class="payload_stat_sub">{{ payloadTracker.round2Samples.length }} samples</span>
                            <span class="payload_stat_vel" v-if="payloadTracker.round2ETA !== null">
                                ETA {{ formatETA(payloadTracker.round2ETA) }}
                            </span>
                        </div>
                    </div>
                    <button class="btn_reset" style="margin-top: 0.75em" @click="payloadTracker.clearData()">Clear Data</button>
                </div>

                <!-- Checkpoint config -->
                <div class="subsection">
                    <p class="subsection_label">Checkpoints per Map</p>
                    <p class="hint" v-if="payloadTracker.lastCheckpointDistance !== null">
                        Last auto-detected: {{ payloadTracker.lastCheckpointDistance.toFixed(1) }}%
                        <span v-if="matchStore.MatchInfo.mapName">(saved for {{ matchStore.MatchInfo.mapName }})</span>
                    </p>

                    <!-- List saved checkpoints -->
                    <div class="checkpoint_list">
                        <div
                            class="checkpoint_entry"
                            v-for="cp in payloadTracker.checkpoints"
                            :key="cp.mapName"
                        >
                            <span class="checkpoint_map">{{ cp.mapName }}</span>
                            <input
                                type="number"
                                class="checkpoint_input"
                                v-model.number="cp.checkpointDistance"
                                min="0" max="100" step="0.1"
                                @change="payloadTracker.setCheckpoint(cp.mapName, cp.checkpointDistance)"
                            />
                            <span class="checkpoint_pct">%</span>
                            <button class="btn_delete" @click="payloadTracker.removeCheckpoint(cp.mapName)">✕</button>
                        </div>
                    </div>

                    <!-- Add checkpoint for current map -->
                    <div class="form_row" style="margin-top: 0.6em" v-if="matchStore.MatchInfo.mapName">
                        <label style="min-width: unset; font-size: 0.82em;">{{ matchStore.MatchInfo.mapName }}</label>
                        <input
                            type="number"
                            v-model.number="manualCheckpointVal"
                            min="0" max="100" step="0.1"
                            style="width: 70px; flex: unset;"
                        />
                        <span style="font-size:0.85em; color: rgba(255,255,255,0.5)">%</span>
                        <button @click="saveManualCheckpoint">Set CP</button>
                    </div>
                </div>

            </div>
            <!-- end Payload tab -->

            <!-- ══ KILLS TAB ════════════════════════════════════════ -->
            <div class="tab_content" v-show="topTab === 'kills'">

                <!-- Event count + clear -->
                <div class="kf_header_row">
                    <span class="kf_event_count">{{ killTracker.events.length }} kill events this match</span>
                    <button class="btn_reset" style="font-size:0.78em" @click="clearKillLog">Clear Log</button>
                </div>

                <!-- Player selector -->
                <div class="form_row" style="margin-bottom: 0.9em">
                    <label>Player</label>
                    <select v-model="selectedKillPlayerID">
                        <option :value="-1" disabled>Select a player</option>
                        <option
                            v-for="p in activePlayers"
                            :key="p.playerID"
                            :value="p.playerID"
                        >{{ p.name || `Player ${p.playerID}` }}</option>
                    </select>
                </div>

                <!-- Per-player stats when someone is selected -->
                <template v-if="selectedKillPlayerID !== -1 && killTracker.events.length > 0">
                    <!-- K/D summary bar -->
                    <div class="kf_kd_bar">
                        <div class="kf_kd_stat kf_kd_stat--kills">
                            <span class="kf_kd_num">{{ killTracker.totalKills(selectedKillPlayerID) }}</span>
                            <span class="kf_kd_label">Kills</span>
                        </div>
                        <div class="kf_kd_divider"></div>
                        <div class="kf_kd_stat kf_kd_stat--deaths">
                            <span class="kf_kd_num">{{ killTracker.totalDeaths(selectedKillPlayerID) }}</span>
                            <span class="kf_kd_label">Deaths</span>
                        </div>
                        <div class="kf_kd_divider"></div>
                        <div class="kf_kd_stat">
                            <span class="kf_kd_num">{{
                                killTracker.totalDeaths(selectedKillPlayerID) === 0
                                    ? '∞'
                                    : (killTracker.totalKills(selectedKillPlayerID) / killTracker.totalDeaths(selectedKillPlayerID)).toFixed(2)
                            }}</span>
                            <span class="kf_kd_label">K/D</span>
                        </div>
                    </div>

                    <!-- Two-column breakdown -->
                    <div class="kf_columns">

                        <!-- KILLED column -->
                        <div class="kf_col">
                            <div class="kf_col_header kf_col_header--kills">Killed</div>
                            <div class="kf_matchup_list">
                                <div
                                    class="kf_matchup"
                                    v-for="(m, i) in killTracker.killMatchups(selectedKillPlayerID)"
                                    :key="'km'+i"
                                >
                                    <span class="kf_matchup_count">×{{ m.count }}</span>
                                    <img v-if="m.weaponIcon" :src="m.weaponIcon" class="kf_weapon_icon" :title="m.weaponName" />
                                    <span v-else class="kf_weapon_text">{{ m.weaponName }}</span>
                                    <span class="kf_hs_badge" v-if="m.headShot" title="Headshot">💀</span>
                                    <span class="kf_matchup_name" :class="m.opponentTeam === 0 ? 'kf_name--red' : 'kf_name--blue'">
                                        {{ m.opponentName || `P${m.opponentID}` }}
                                    </span>
                                </div>
                                <div class="kf_empty" v-if="killTracker.killMatchups(selectedKillPlayerID).length === 0">No kills yet</div>
                            </div>
                        </div>

                        <!-- KILLED BY column -->
                        <div class="kf_col">
                            <div class="kf_col_header kf_col_header--deaths">Killed By</div>
                            <div class="kf_matchup_list">
                                <div
                                    class="kf_matchup"
                                    v-for="(m, i) in killTracker.deathMatchups(selectedKillPlayerID)"
                                    :key="'dm'+i"
                                >
                                    <span class="kf_matchup_count">×{{ m.count }}</span>
                                    <img v-if="m.weaponIcon" :src="m.weaponIcon" class="kf_weapon_icon" :title="m.weaponName" />
                                    <span v-else class="kf_weapon_text">{{ m.weaponName }}</span>
                                    <span class="kf_hs_badge" v-if="m.headShot" title="Headshot">💀</span>
                                    <span class="kf_matchup_name" :class="m.opponentTeam === 0 ? 'kf_name--red' : 'kf_name--blue'">
                                        {{ m.opponentName || `P${m.opponentID}` }}
                                    </span>
                                </div>
                                <div class="kf_empty" v-if="killTracker.deathMatchups(selectedKillPlayerID).length === 0">No deaths yet</div>
                            </div>
                        </div>

                    </div>
                </template>

                <!-- No player selected -->
                <p class="empty_msg" v-else-if="selectedKillPlayerID === -1">
                    Select a player above to see their kill breakdown.
                </p>
                <p class="empty_msg" v-else>
                    No kill data yet this match.
                </p>

                <!-- Recent event log -->
                <div class="subsection" style="margin-top: 0.9em" v-if="killTracker.events.length > 0">
                    <p class="subsection_label">Recent Events (newest first)</p>
                    <div class="kf_log">
                        <div
                            class="kf_log_row"
                            v-for="e in killTracker.recentEvents"
                            :key="e.id"
                        >
                            <span class="kf_log_killer" :class="e.killerTeam === 0 ? 'kf_name--red' : 'kf_name--blue'">
                                {{ e.killerName }}
                            </span>
                            <img v-if="e.weaponIcon" :src="e.weaponIcon" class="kf_weapon_icon kf_weapon_icon--sm" :title="e.weaponName" />
                            <span v-else class="kf_weapon_text kf_weapon_text--sm">{{ e.weaponName }}</span>
                            <span class="kf_hs_badge" v-if="e.headShot">💀</span>
                            <span class="kf_log_victim" :class="e.victimTeam === 0 ? 'kf_name--red' : 'kf_name--blue'">
                                {{ e.victimName }}
                            </span>
                            <span class="kf_log_streak" v-if="e.killStreak > 1">🔥{{ e.killStreak }}</span>
                        </div>
                    </div>
                </div>

            </div>
            <!-- end Kills tab -->
            <!-- ══ DOM TAB ══════════════════════════════════════════════ -->
            <div class="tab_content" v-show="topTab === 'dom'">

                <!-- Status + reset row -->
                <div class="kf_header_row">
                    <span class="kf_event_count">{{ domTracker.captureLog.length }} captures this match</span>
                    <button class="btn_reset" style="font-size:0.78em" @click="domTracker.reset()">Reset</button>
                </div>

                <!-- Point state badges -->
                <div class="dom_point_row">
                    <div class="dom_point" :class="domPointClass(domTracker.captureLog, 'A', matchStore.MatchInfo.domination.pointA)">
                        <span class="dom_point_label">A</span>
                        <span class="dom_point_team">{{ teamLabel(matchStore.MatchInfo.domination.pointA) }}</span>
                        <div class="dom_point_stats">
                            <span class="dom_point_stat"><span class="dom_point_stat_num">{{ domTracker.pointCaptures.A }}</span><span class="dom_point_stat_label">cap</span></span>
                            <span class="dom_point_stat"><span class="dom_point_stat_num">{{ domTracker.pointCounters.A }}</span><span class="dom_point_stat_label">ctr</span></span>
                        </div>
                    </div>
                    <div class="dom_point" :class="domPointClass(domTracker.captureLog, 'B', matchStore.MatchInfo.domination.pointB)">
                        <span class="dom_point_label">B</span>
                        <span class="dom_point_team">{{ teamLabel(matchStore.MatchInfo.domination.pointB) }}</span>
                        <div class="dom_point_stats">
                            <span class="dom_point_stat"><span class="dom_point_stat_num">{{ domTracker.pointCaptures.B }}</span><span class="dom_point_stat_label">cap</span></span>
                            <span class="dom_point_stat"><span class="dom_point_stat_num">{{ domTracker.pointCounters.B }}</span><span class="dom_point_stat_label">ctr</span></span>
                        </div>
                    </div>
                    <div class="dom_point" :class="domPointClass(domTracker.captureLog, 'C', matchStore.MatchInfo.domination.pointC)">
                        <span class="dom_point_label">C</span>
                        <span class="dom_point_team">{{ teamLabel(matchStore.MatchInfo.domination.pointC) }}</span>
                        <div class="dom_point_stats">
                            <span class="dom_point_stat"><span class="dom_point_stat_num">{{ domTracker.pointCaptures.C }}</span><span class="dom_point_stat_label">cap</span></span>
                            <span class="dom_point_stat"><span class="dom_point_stat_num">{{ domTracker.pointCounters.C }}</span><span class="dom_point_stat_label">ctr</span></span>
                        </div>
                    </div>
                </div>

                <!-- Captures section -->
                <div class="section">
                    <h2>Captures</h2>
                    <div class="dom_stat_row">
                        <div class="dom_stat dom_stat--blue">
                            <span class="dom_stat_num">{{ domTracker.blueCaptures }}</span>
                            <span class="dom_stat_label">Blue</span>
                        </div>
                        <div class="dom_stat_divider"></div>
                        <div class="dom_stat dom_stat--red">
                            <span class="dom_stat_num">{{ domTracker.redCaptures }}</span>
                            <span class="dom_stat_label">Red</span>
                        </div>
                    </div>

                    <!-- Capture log -->
                    <div class="dom_log" v-if="domTracker.captureLog.length > 0">
                        <div
                            class="dom_log_row"
                            v-for="e in domTracker.captureLog"
                            :key="e.id"
                        >
                            <span class="dom_log_point">{{ e.point }}</span>
                            <span class="dom_log_from" :class="e.fromTeam === 0 ? 'kf_name--red' : e.fromTeam === 1 ? 'kf_name--blue' : 'dom_name--none'">{{ teamLabel(e.fromTeam) }}</span>
                            <span class="dom_log_arrow">→</span>
                            <span class="dom_log_to" :class="e.toTeam === 0 ? 'kf_name--red' : e.toTeam === 1 ? 'kf_name--blue' : 'dom_name--none'">{{ teamLabel(e.toTeam) }}</span>
                        </div>
                    </div>
                    <p class="empty_msg" v-else>No captures yet.</p>
                </div>

                <!-- Counters section -->
                <div class="section">
                    <h2>Counters</h2>
                    <div class="dom_stat_row">
                        <div class="dom_stat dom_stat--blue">
                            <span class="dom_stat_num">{{ domTracker.blueCounters }}</span>
                            <span class="dom_stat_label">Blue</span>
                        </div>
                        <div class="dom_stat_divider"></div>
                        <div class="dom_stat dom_stat--red">
                            <span class="dom_stat_num">{{ domTracker.redCounters }}</span>
                            <span class="dom_stat_label">Red</span>
                        </div>
                    </div>
                    <p class="hint" style="margin-top:0.4em">A counter is recorded when a team holds all 3 points but loses one before the 5-second timer expires.</p>
                </div>

            </div>
            <!-- end Dom tab -->

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { iconModes } from "@/interfaces/StoreInterfaces/StoreState";
import { useSettingStore } from "@/stores/SettingsStore";
import { useKohZoneStore } from "@/stores/KohZoneStore";
import { useKohScoreStore, showKohScores, type KohMode } from "@/stores/KohScoreStore";
import { useMatchStateStore } from "@/stores/MatchStateStore";
import { usePayloadTrackerStore, showPayloadOverlay, payloadChartType } from "@/stores/PayloadTrackerStore";
import { useKillTrackerStore } from "@/stores/KillTrackerStore";
import type { KohZone } from "@/interfaces/KohZone";
import { isMenuOpen, headshotFlashEnabled } from "@/stores/UiState";
import { useDominationTrackerStore } from "@/stores/DominationTrackerStore";
import { Teams } from "@/interfaces/StoreInterfaces/MatchInfo";

// ── Top-level tab ─────────────────────────────────────────────────────────────
const topTab = ref<"settings" | "koh" | "payload" | "kills" | "dom">("settings");

// ── Domination tracker ──────────────────────────────────────────────────────────────────
const domTracker = useDominationTrackerStore();

function teamLabel(team: Teams): string {
    if (team === Teams.blue) return 'Blue';
    if (team === Teams.red)  return 'Red';
    return '—';
}

function domPointClass(_log: any, _point: string, team: Teams): string {
    if (team === Teams.blue) return 'dom_point--blue';
    if (team === Teams.red)  return 'dom_point--red';
    return 'dom_point--none';
}

// ── Payload tracker ───────────────────────────────────────────────────────────
const payloadTracker = usePayloadTrackerStore();
const manualCheckpointVal = ref(35);

function saveManualCheckpoint() {
    const map = matchStore.MatchInfo.mapName;
    if (!map) return;
    payloadTracker.setCheckpoint(map, manualCheckpointVal.value);
}

const latestR1Distance = computed(() => {
    const s = payloadTracker.round1Samples;
    return s.length > 0 ? s[s.length - 1].distance.toFixed(1) : "0.0";
});

const latestR2Distance = computed(() => {
    const s = payloadTracker.round2Samples;
    return s.length > 0 ? s[s.length - 1].distance.toFixed(1) : "0.0";
});

function formatETA(eta: number | null): string {
    if (eta === null) return "—";
    if (eta === 0) return "DONE";
    const s = Math.round(eta);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ── Kill tracker ──────────────────────────────────────────────────────────────
const killTracker = useKillTrackerStore();
const selectedKillPlayerID = ref<number>(-1);

function clearKillLog() {
    killTracker.events.splice(0);
}

// ── Settings logic ────────────────────────────────────────────────────────────
const settingState = useSettingStore();

const iconURLSetting = computed({
    get() { return settingState.IconSettings.iconMode; },
    set(v: iconModes) { settingState.IconSettings.iconMode = v; }
});
const redIconURLSetting = computed({
    get() { return settingState.IconSettings.customRedIcon; },
    set(v: string) { settingState.IconSettings.customRedIcon = v; }
});
const blueIconURLSetting = computed({
    get() { return settingState.IconSettings.customBlueIcon; },
    set(v: string) { settingState.IconSettings.customBlueIcon = v; }
});

// ── KoH stores ────────────────────────────────────────────────────────────────
const kohStore = useKohZoneStore();
const scoreStore = useKohScoreStore();
const matchStore = useMatchStateStore();

const scoreMode = ref<KohMode>(scoreStore.mode);

// ── KoH sub-tab ───────────────────────────────────────────────────────────────
const kohTab = ref<"zones" | "edit" | "scoring">("zones");

// ── Zone filter ───────────────────────────────────────────────────────────────
const filterMap = ref("");
const filteredZones = computed(() => {
    if (!filterMap.value) return kohStore.zones;
    return kohStore.zones.filter((z) => z.mapName === filterMap.value);
});

// ── Zone form ─────────────────────────────────────────────────────────────────
const defaultForm = (): Omit<KohZone, "id"> => ({
    name: "",
    mapName: matchStore.MatchInfo.mapName || "",
    centerX: 0, centerY: 0, centerZ: 0,
    width: 5, depth: 5, robotHeight: 2,
    imageDataUrl: "",
});

const form = ref(defaultForm());
const editingId = ref<string | null>(null);
const imageSizeWarning = ref(false);
const exportNotice = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);

const selectedPlayerIndex = ref(-1);
const activePlayers = computed(() => matchStore.PlayerData.filter((p) => p.isActive));

function capturePlayerPosition() {
    const player = matchStore.PlayerData.find((p) => p.playerID === selectedPlayerIndex.value && p.isActive);
    if (!player) return;
    form.value.centerX = parseFloat(player.feetPosition.X.toFixed(3));
    form.value.centerY = parseFloat(player.feetPosition.Y.toFixed(3));
    form.value.centerZ = parseFloat(player.feetPosition.Z.toFixed(3));
}

function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    imageSizeWarning.value = file.size > 500 * 1024;
    const reader = new FileReader();
    reader.onload = (e) => { form.value.imageDataUrl = (e.target?.result as string) ?? ""; };
    reader.readAsDataURL(file);
}

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
    kohTab.value = "zones";
}

function editZone(zone: KohZone) {
    editingId.value = zone.id;
    form.value = { name: zone.name, mapName: zone.mapName, centerX: zone.centerX, centerY: zone.centerY, centerZ: zone.centerZ, width: zone.width, depth: zone.depth, robotHeight: zone.robotHeight, imageDataUrl: zone.imageDataUrl };
    imageSizeWarning.value = false;
    kohTab.value = "edit";
}

function cancelEdit() {
    editingId.value = null;
    resetForm();
    kohTab.value = "zones";
}

function confirmDelete(id: string) {
    if (confirm("Delete this zone?")) kohStore.deleteZone(id);
}

function resetForm() {
    form.value = defaultForm();
    selectedPlayerIndex.value = -1;
    imageSizeWarning.value = false;
    if (fileInputRef.value) fileInputRef.value.value = "";
}

async function exportJson() {
    try {
        await navigator.clipboard.writeText(kohStore.exportJson());
        exportNotice.value = "Copied! Paste into src/data/KohZones.json and commit.";
    } catch {
        exportNotice.value = "Clipboard unavailable.";
    }
    setTimeout(() => (exportNotice.value = ""), 5000);
}
</script>

<style scoped lang="scss">
.panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 6;
    display: flex;
    align-items: stretch;
    pointer-events: none;
    animation: slideIn 0.2s ease-out forwards;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
}

.panel_wrapper {
    pointer-events: all;
    width: 400px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: rgba(12, 12, 22, 0.93);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    color: #e8e8e8;
}

// ── Header
.panel_header {
    display: flex;
    align-items: center;
    gap: 0.75em;
    padding: 0.85em 1.2em;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    h1 {
        margin: 0;
        font-size: 0.95em;
        color: #fff;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }
}

.panel_hint {
    flex: 1;
    font-size: 0.72em;
    color: rgba(255, 255, 255, 0.28);
    letter-spacing: 0.04em;
}

.close_btn {
    font-size: 0.88em;
    padding: 0.28em 0.6em;
    background: rgba(255, 255, 255, 0.07);
    color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.13);
    border-radius: 3px;
    cursor: pointer;

    &:hover {
        background: rgba(255, 70, 70, 0.22);
        color: #fff;
        border-color: rgba(255, 70, 70, 0.4);
    }
}

// ── Tab bars
.tab_bar {
    display: flex;
    flex-shrink: 0;
}

.tab_bar--top {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab_bar--sub {
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(255, 255, 255, 0.02);
}

.tab_btn {
    flex: 1;
    padding: 0.65em 0.4em;
    font-size: 0.83em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: transparent;
    color: rgba(255, 255, 255, 0.4);
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, background 0.15s;

    &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.75);
    }

    &.tab_btn--active {
        color: #fff;
        border-bottom-color: #4d8fff;
        background: rgba(77, 143, 255, 0.07);
    }

    &.tab_btn--editing {
        color: #ffd166;
        &.tab_btn--active {
            border-bottom-color: #ffd166;
            background: rgba(255, 209, 102, 0.07);
        }
    }
}

.tab_btn--sub {
    padding: 0.45em 0.4em;
    font-size: 0.76em;

    &.tab_btn--active {
        border-bottom-color: #7eb8ff;
        background: rgba(126, 184, 255, 0.06);
    }
}

// ── Tab content areas
.tab_content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1.1em 1.2em 1.5em;
}

.tab_content--koh {
    padding: 0;
    display: flex;
    flex-direction: column;
}

.sub_content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 1em 1.2em 1.5em;
}

// ── Settings section
.section {
    h2 {
        margin: 0 0 0.8em;
        font-size: 0.88em;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }
}

.toggle_row {
    display: flex;
    align-items: center;
    gap: 0.6em;
    font-size: 0.88em;
    color: rgba(255, 255, 255, 0.75);
    cursor: pointer;
    user-select: none;

    input[type="checkbox"] {
        width: 14px;
        height: 14px;
        accent-color: #72aeff;
        cursor: pointer;
    }
}

.radio_group {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    margin-bottom: 1em;

    label {
        display: flex;
        align-items: center;
        gap: 0.5em;
        font-size: 0.95em;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
    }

    input[type="radio"] {
        accent-color: #4d8fff;
    }
}

.custom_icons {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
}

.icon_row {
    display: flex;
    align-items: center;
    gap: 0.6em;

    label {
        min-width: 75px;
        font-size: 0.88em;
        color: rgba(255, 255, 255, 0.65);
        font-weight: 600;
    }

    .inputURL {
        flex: 1;
        font-size: 0.88em;
        padding: 0.35em 0.45em;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 3px;
        background: #1a1a2e;
        color: #fff;
    }
}

.icon_preview {
    width: 48px;
    height: 48px;
    object-fit: contain;
    border-radius: 3px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
}

// ── Zone filter
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

        option { background: #1a1a2e; color: #fff; }
    }
}

// ── Active zone bar
.active_zone_bar {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.4em 0.7em;
    margin-bottom: 0.75em;
    background: rgba(0, 200, 100, 0.1);
    border: 1px solid rgba(0, 200, 100, 0.32);
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
    background: rgba(255, 255, 255, 0.06) !important;
    border-color: rgba(255, 255, 255, 0.13) !important;
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
    background: rgba(255, 255, 255, 0.05);
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.zone_map { color: rgba(255, 255, 255, 0.5); }

.zone_coords {
    font-family: monospace;
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.55);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.zone_entry--active {
    border-color: rgba(0, 200, 100, 0.42);
    background: rgba(0, 200, 100, 0.06);
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
    color: rgba(255, 255, 255, 0.5) !important;

    &.btn_activate--on {
        background: rgba(0, 200, 100, 0.18) !important;
        border-color: rgba(0, 200, 100, 0.5) !important;
        color: #0c6 !important;
    }
}

.btn_delete {
    background: rgba(160, 25, 25, 0.45) !important;
    border-color: rgba(200, 55, 55, 0.5) !important;
    color: #ffaaaa !important;
}

.empty_msg {
    color: rgba(255, 255, 255, 0.32);
    font-style: italic;
    font-size: 0.9em;
    text-align: center;
    padding: 1.5em 0;

    strong { color: rgba(255, 255, 255, 0.55); font-style: normal; }
}

// ── Form shared
.form_row {
    display: flex;
    align-items: center;
    gap: 0.6em;
    margin-bottom: 0.75em;

    label {
        min-width: 78px;
        font-weight: 600;
        font-size: 0.88em;
        color: rgba(255, 255, 255, 0.68);
    }

    input[type="text"],
    input[type="number"],
    select {
        flex: 1;
        font-size: 0.93em;
        padding: 0.35em 0.45em;
        border: 1px solid rgba(255, 255, 255, 0.17);
        border-radius: 3px;
        background: #1a1a2e;
        color: #fff;
    }

    select option { background: #1a1a2e; color: #fff; }

    input[type="file"] {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.88em;
    }
}

.form_row--coords {
    flex-wrap: wrap;
    gap: 0.35em;
    label { min-width: unset; }
    input[type="number"] { width: 68px; flex: unset; }
}

.form_row--dims {
    flex-wrap: wrap;
    gap: 0.35em;
    label { min-width: unset; }
    input[type="number"] { width: 58px; flex: unset; }
    select { flex: unset; min-width: 108px; }
}

.subsection {
    border-left: 2px solid rgba(255, 255, 255, 0.1);
    padding-left: 0.85em;
    margin-bottom: 1.1em;
}

.subsection_label {
    font-size: 0.75em;
    color: rgba(255, 255, 255, 0.35);
    margin: 0 0 0.55em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.hint {
    font-size: 0.8em;
    color: rgba(255, 255, 255, 0.35);
    margin: 0.2em 0 0;
}

.hint.warn { color: #f90; }

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
    border: 1px solid rgba(255,255,255,0.18);
}

.btn_clear_img { font-size: 0.8em; padding: 0.2em 0.5em; }

.form_actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.2em;
}

.form_actions_left { display: flex; gap: 0.5em; }

.btn_save {
    background: #0045ff !important;
    color: #fff !important;
    border: none !important;
    padding: 0.5em 1.2em;
    font-size: 0.95em;
    &:hover { background: #0030cc !important; }
}

.btn_export {
    background: rgba(255,255,255,0.09) !important;
    color: rgba(255,255,255,0.65) !important;
    border: 1px solid rgba(255,255,255,0.16) !important;
    padding: 0.5em 1em;
    font-size: 0.88em;
    &:hover { background: rgba(255,255,255,0.16) !important; color: #fff !important; }
}

.export_notice {
    margin-top: 0.5em;
    font-size: 0.82em;
    color: #4f4;
}

// ── Scoring
.score_status {
    display: flex;
    align-items: center;
    gap: 0.5em;
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.42);
    margin-bottom: 0.9em;
}

.score_status_dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
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
    border: 1px solid rgba(255,255,255,0.07);
}

.score_team--blue { background: rgba(0,69,255,0.16); border-color: rgba(114,174,255,0.22); }
.score_team--red  { background: rgba(255,0,0,0.16);  border-color: rgba(255,114,114,0.22); }

.score_team_label {
    font-size: 0.72em;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.48);
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

    &.score_row--blue { background: rgba(0,69,255,0.12); border-left: 3px solid #72aeff; }
    &.score_row--red  { background: rgba(255,0,0,0.12);  border-left: 3px solid #ff7272; }
}

.score_row_name { color: #fff; }
.score_row_pts { font-weight: bold; color: rgba(255,255,255,0.72); font-family: monospace; }

.btn_toggle_scores {
    flex: 1;
    text-align: left;
    &.btn_toggle_scores--on {
        background: rgba(0,200,100,0.16) !important;
        border-color: rgba(0,200,100,0.42) !important;
        color: #0c6 !important;
    }
}

.btn_reset {
    background: rgba(170,35,35,0.28) !important;
    border-color: rgba(200,55,55,0.42) !important;
    color: #ffaaaa !important;
    font-size: 0.85em;
}

// ── Global button base
button {
    background: rgba(255,255,255,0.08);
    color: #e0e0e0;
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: 3px;
    padding: 0.3em 0.7em;
    cursor: pointer;
    font-size: 0.88em;
    transition: background 0.12s;

    &:hover { background: rgba(255,255,255,0.16); }
}

button:disabled { opacity: 0.25; cursor: not-allowed; }

// ── Payload tab specifics
.chart_type_btns {
    display: flex;
    gap: 0.4em;

    button {
        padding: 0.3em 0.7em;
        font-size: 0.85em;

        &.chart_type_btn--active {
            background: rgba(77, 143, 255, 0.25) !important;
            border-color: rgba(77, 143, 255, 0.6) !important;
            color: #7eb8ff !important;
        }
    }
}

.payload_stat_grid {
    display: flex;
    gap: 0.75em;
    margin-bottom: 0.5em;
}

.payload_stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.6em 0.4em;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.08);
    gap: 0.1em;
}

.payload_stat--blue { background: rgba(0,69,255,0.15); border-color: rgba(114,174,255,0.22); }
.payload_stat--red  { background: rgba(255,0,0,0.15);  border-color: rgba(255,114,114,0.22); }

.payload_stat_label {
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.45);
}

.payload_stat_val {
    font-size: 1.6em;
    font-weight: 800;
    font-family: monospace;
    color: #fff;
}

.payload_stat_sub {
    font-size: 0.7em;
    color: rgba(255,255,255,0.35);
}

.payload_stat_vel {
    font-size: 0.78em;
    font-family: monospace;
    color: rgba(255,255,255,0.6);
    margin-top: 0.1em;
}

.checkpoint_list {
    display: flex;
    flex-direction: column;
    gap: 0.4em;
    margin-bottom: 0.5em;
}

.checkpoint_entry {
    display: flex;
    align-items: center;
    gap: 0.4em;
    font-size: 0.88em;
}

.checkpoint_map {
    flex: 1;
    color: rgba(255,255,255,0.75);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.checkpoint_input {
    width: 62px;
    font-size: 0.9em;
    padding: 0.25em 0.35em;
    background: #1a1a2e;
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 3px;
    color: #fff;
    text-align: right;
}

.checkpoint_pct {
    font-size: 0.85em;
    color: rgba(255,255,255,0.45);
}

// ── Kill feed tab ─────────────────────────────────────────────────────────────

.kf_header_row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75em;
}

.kf_event_count {
    font-size: 0.78em;
    color: rgba(255,255,255,0.35);
}

// K/D summary bar
.kf_kd_bar {
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 0;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    margin-bottom: 1em;
    overflow: hidden;
}

.kf_kd_stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.6em 0.4em;

    &--kills  { background: rgba(0,200,80,0.07); }
    &--deaths { background: rgba(200,40,40,0.07); }
}

.kf_kd_num {
    font-size: 1.55em;
    font-weight: 800;
    font-family: monospace;
    color: #fff;
    line-height: 1.1;
}

.kf_kd_label {
    font-size: 0.65em;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: rgba(255,255,255,0.38);
    margin-top: 0.15em;
}

.kf_kd_divider {
    width: 1px;
    background: rgba(255,255,255,0.08);
    flex-shrink: 0;
}

// Two-column matchup layout
.kf_columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6em;
    margin-bottom: 0.5em;
}

.kf_col {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.kf_col_header {
    font-size: 0.68em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0.3em 0.5em;
    border-radius: 3px 3px 0 0;
    margin-bottom: 2px;

    &--kills  { background: rgba(0,200,80,0.14);  color: #0c6; }
    &--deaths { background: rgba(200,40,40,0.18); color: #f66; }
}

.kf_matchup_list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 200px;
    overflow-y: auto;
}

.kf_matchup {
    display: flex;
    align-items: center;
    gap: 0.3em;
    padding: 0.25em 0.4em;
    background: rgba(255,255,255,0.04);
    border-radius: 3px;
    font-size: 0.82em;
    min-width: 0;
}

.kf_matchup_count {
    font-family: monospace;
    font-weight: 700;
    font-size: 0.9em;
    color: rgba(255,255,255,0.55);
    flex-shrink: 0;
    min-width: 22px;
}

.kf_weapon_icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
    filter: invert(1) opacity(0.7);
    flex-shrink: 0;

    &--sm {
        width: 13px;
        height: 13px;
    }
}

.kf_weapon_text {
    font-size: 0.75em;
    color: rgba(255,255,255,0.45);
    flex-shrink: 0;

    &--sm { font-size: 0.7em; }
}

.kf_hs_badge {
    font-size: 0.75em;
    flex-shrink: 0;
    opacity: 0.85;
}

.kf_matchup_name {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
}

.kf_name--red  { color: #ff7272; }
.kf_name--blue { color: #72aeff; }

.kf_empty {
    font-size: 0.78em;
    color: rgba(255,255,255,0.25);
    padding: 0.4em 0.5em;
    font-style: italic;
}

// Event log
.kf_log {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 180px;
    overflow-y: auto;
}

.kf_log_row {
    display: flex;
    align-items: center;
    gap: 0.35em;
    padding: 0.2em 0.4em;
    background: rgba(255,255,255,0.03);
    border-radius: 3px;
    font-size: 0.8em;
    min-width: 0;
}

.kf_log_killer,
.kf_log_victim {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 90px;
}

.kf_log_streak {
    font-size: 0.8em;
    margin-left: auto;
    flex-shrink: 0;
    color: rgba(255,200,80,0.9);
}

// ── Domination tab styles ───────────────────────────────────────────────────────────────

.dom_point_row {
    display: flex;
    gap: 0.5em;
    margin-bottom: 1em;
    justify-content: space-between;
}

.dom_point {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5em;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);

    &--blue { border-color: rgba(100,160,255,0.5); background: rgba(0,69,255,0.15); }
    &--red  { border-color: rgba(255,100,100,0.5); background: rgba(255,0,0,0.15); }
    &--none { opacity: 0.4; }
}

.dom_point_label {
    font-size: 1.1em;
    font-weight: 800;
    font-family: monospace;
    color: #fff;
}

.dom_point_team {
    font-size: 0.65em;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.55);
    margin-top: 2px;
}

.dom_stat_row {
    display: flex;
    align-items: center;
    gap: 0;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 0.6em;
}

.dom_stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5em 0.4em;

    &--blue { background: rgba(0,69,255,0.12); }
    &--red  { background: rgba(255,0,0,0.12); }
}

.dom_stat_num {
    font-size: 1.55em;
    font-weight: 800;
    font-family: monospace;
    color: #fff;
    line-height: 1.1;
}

.dom_stat_label {
    font-size: 0.65em;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.38);
    margin-top: 0.15em;
}

.dom_stat_divider {
    width: 1px;
    align-self: stretch;
    background: rgba(255,255,255,0.08);
    flex-shrink: 0;
}

.dom_log {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 200px;
    overflow-y: auto;
    margin-top: 0.4em;
}

.dom_log_row {
    display: flex;
    align-items: center;
    gap: 0.45em;
    padding: 0.22em 0.5em;
    background: rgba(255,255,255,0.03);
    border-radius: 3px;
    font-size: 0.82em;
}

.dom_log_point {
    font-family: monospace;
    font-weight: 800;
    font-size: 1em;
    color: #fff;
    min-width: 12px;
    text-align: center;
}

.dom_log_from,
.dom_log_to {
    font-weight: 600;
    min-width: 28px;
}

.dom_log_arrow {
    color: rgba(255,255,255,0.3);
    font-size: 0.85em;
}

.dom_name--none { color: rgba(255,255,255,0.3); }
.dom_point_stats {
    display: flex;
    gap: 0.6em;
    margin-top: 0.35em;
    padding-top: 0.3em;
    border-top: 1px solid rgba(255,255,255,0.1);
    width: 100%;
    justify-content: center;
}

.dom_point_stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
}

.dom_point_stat_num {
    font-family: monospace;
    font-size: 0.95em;
    font-weight: 800;
    color: #fff;
    line-height: 1;
}

.dom_point_stat_label {
    font-size: 0.55em;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.35);
}

</style>
