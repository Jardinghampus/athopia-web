import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rumorStatus } from "@/lib/rumor/rumor-status";

describe("rumorStatus", () => {
  it("denial heuristic wins over a high confidence score", () => {
    assert.equal(
      rumorStatus({ title: "Klubben dementerar ryktena", transferConfidence: 0.95 }),
      "dementerat",
    );
  });

  it("confirms at the 0.85 boundary", () => {
    assert.equal(rumorStatus({ title: "X klar för Y", transferConfidence: 0.85 }), "bekraftat");
  });

  it("reports just below the confirmed boundary", () => {
    assert.equal(rumorStatus({ title: "X nära klart", transferConfidence: 0.84 }), "rapporteras");
  });

  it("reports at the 0.6 boundary", () => {
    assert.equal(rumorStatus({ title: "X kopplas till Y", transferConfidence: 0.6 }), "rapporteras");
  });

  it("rumors just below the reported boundary", () => {
    assert.equal(rumorStatus({ title: "X kan vara aktuell", transferConfidence: 0.59 }), "ryktas");
  });

  it("rumors at low confidence", () => {
    assert.equal(rumorStatus({ title: "Spekulation om X", transferConfidence: 0.1 }), "ryktas");
  });

  it("matches denial phrases in summary too", () => {
    assert.equal(
      rumorStatus({
        title: "Uppdatering om X",
        summary: "Spelaren stannar kvar enligt klubben.",
        transferConfidence: 0.9,
      }),
      "dementerat",
    );
  });
});
