import {
  advanceQueue,
  buildTutorialCards,
  createInitialTutorialEngineState,
  enqueueEvent,
  shouldDismissRevealOnCorrectTap,
} from "./tutorialEngine";

describe("tutorialEngine", () => {
  test("correct_first builds congrats -> score -> next-station chain", () => {
    const cards = buildTutorialCards("correct_first", {
      tutorialActive: true,
      isSpeedrun: false,
      currentStation: "Buona Vista",
      wrongCount: 0,
      clickedStationsCount: 1,
      totalStations: 5,
      newlyCorrectStation: "Dhoby Ghaut",
      revealedStation: null,
    });

    expect(cards.map((c) => c.target)).toEqual(["center", "score", "station-card"]);
    expect(cards[0].text).toContain("Dhoby Ghaut");
    expect(cards[2].text).toContain("Buona Vista");
  });

  test("advanceQueue walks event cards one by one", () => {
    let state = enqueueEvent(createInitialTutorialEngineState(), "correct_first", [
      { target: "center", text: "a" },
      { target: "score", text: "b" },
      { target: "station-card", text: "c" },
    ], {
      tutorialActive: true,
      isSpeedrun: false,
      currentStation: "Buona Vista",
      wrongCount: 0,
      clickedStationsCount: 1,
      totalStations: 5,
      newlyCorrectStation: "Dhoby Ghaut",
      revealedStation: null,
    });

    expect(state.queue).toHaveLength(3);
    state = advanceQueue(state);
    expect(state.queue[0].target).toBe("score");
    state = advanceQueue(state);
    expect(state.queue[0].target).toBe("station-card");
    state = advanceQueue(state);
    expect(state.visible).toBe(false);
    expect(state.activeEvent).toBeNull();
  });

  test("3-wrong reveal dismisses only on revealed station tap", () => {
    const state = enqueueEvent(createInitialTutorialEngineState(), "wrong_thrice_reveal", [
      { target: "correct-station", text: "Hume is here", continueable: false },
    ], {
      tutorialActive: true,
      isSpeedrun: false,
      currentStation: "Hume",
      wrongCount: 3,
      clickedStationsCount: 0,
      totalStations: 5,
      newlyCorrectStation: "",
      revealedStation: null,
    });

    expect(shouldDismissRevealOnCorrectTap(state, "Dhoby Ghaut")).toBe(false);
    expect(shouldDismissRevealOnCorrectTap(state, "Hume")).toBe(true);
  });
});
