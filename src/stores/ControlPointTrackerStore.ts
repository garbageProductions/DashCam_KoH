import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Teams } from '@/interfaces/StoreInterfaces/MatchInfo';

export const useControlPointTrackerStore = defineStore('controlPointTracker', () => {
    const blueCaptures = ref(0);
    const redCaptures  = ref(0);

    // Non-reactive: previous controlling team for diffing
    let prevTeam: Teams = Teams.none;

    function onControlPoint(controllingTeam: Teams) {
        // Only count a capture when the team actually changes to a real team
        if (controllingTeam !== prevTeam && controllingTeam !== Teams.none) {
            if (controllingTeam === Teams.blue) blueCaptures.value++;
            else if (controllingTeam === Teams.red) redCaptures.value++;
        }
        prevTeam = controllingTeam;
    }

    function reset() {
        blueCaptures.value = 0;
        redCaptures.value  = 0;
        prevTeam           = Teams.none;
    }

    return { blueCaptures, redCaptures, onControlPoint, reset };
});
