import { buildTutorialCards, shouldTriggerTutorialEvent } from "./tutorialFlow";

describe("tutorialFlow", () => {
  test("correct_first chains congrats -> score -> next station", () => {
    const cards = buildTutorialCards("correct_first", {
      station: "Dhoby Ghaut",
      found: 1,
      total: 5,
    });

    expect(cards).toHaveLength(3);
    expect(cards[0].target).toBe("center");
    expect(cards[1].target).toBe("score");
    expect(cards[2].target).toBe("station-card");
    expect(cards[0].text).toContain("Dhoby Ghaut");
    expect(cards[1].text).toContain("1");
    expect(cards[1].text).toContain("5");
  });

  test("wrong_once_lives inserts station name", () => {
    const cards = buildTutorialCards("wrong_once_lives", {
      station: "Hume",
      found: 0,
      total: 5,
      triesLeft: 2,
    });

    expect(cards).toHaveLength(1);
    expect(cards[0].target).toBe("lives");
    expect(cards[0].text).toContain("Hume");
  });

  test("wrong_thrice_reveal produces non-continue card", () => {
    const cards = buildTutorialCards("wrong_thrice_reveal", {
      station: "Hume",
      found: 0,
      total: 5,
    });

    expect(cards).toHaveLength(1);
    expect(cards[0].target).toBe("correct-station");
    expect(cards[0].continueable).toBe(false);
    expect(cards[0].text).toContain("Hume");
  });

  test("shouldTriggerTutorialEvent only fires unseen events", () => {
    expect(shouldTriggerTutorialEvent("intro_find_station", {})).toBe(true);
    expect(shouldTriggerTutorialEvent("intro_find_station", { intro_find_station: true })).toBe(false);
  });
});
