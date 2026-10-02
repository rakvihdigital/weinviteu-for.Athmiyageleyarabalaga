"use client";

import { useEffect } from "react";

export default function TempleInvitation() {
  useEffect(() => {
    const ctl = { dead: false, dispose: null };
    import("../lib/temple").then((m) => {
      if (!ctl.dead) m.initTemple(ctl);
    });
    return () => {
      ctl.dead = true;
      if (ctl.dispose) ctl.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        id="c"
        aria-label="Interactive temple invitation. Press Enter to open the doors, then scroll or use the arrow keys to walk through."
      />
      <div id="veil" />
      <div id="welcome">
        <span className="kn">ಗಣೇಶೋತ್ಸವಕ್ಕೆ ಸುಸ್ವಾಗತ</span>
        <span className="rule" />
        <span className="en">
          WELCOME TO THE GANESHA FESTIVAL
          <br />
          02 – 04 OCTOBER 2026 ◆ BANGALORE
        </span>
      </div>
      <div id="hint" role="status" />
      <button id="rsvp" type="button">RSVP</button>
      <div id="fail">
        This invitation needs WebGL, which this browser could not start. Try opening it in a current version of
        Chrome, Safari or Firefox.
      </div>
    </>
  );
}
