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
          02 – 04 OCTOBER 2026
          <br />
          YELAHANKA NEWTOWN, BANGALORE
        </span>
      </div>
      <div id="hint" role="status" />
      <button id="sound" type="button" aria-label="Turn music off">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" />
          <path className="wave" d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" />
          <path className="slash" d="M16 9.5l5 5M21 9.5l-5 5" />
        </svg>
      </button>
      <a
        id="rsvp"
        href="https://www.google.com/maps/search/?api=1&query=1647%2C+17th+B+Cross+Rd%2C+LIG+3rd+Stage%2C+Chikka+Bommasandra%2C+Yelahanka+New+Town%2C+Bengaluru%2C+Karnataka+560064%2C+India"
        target="_blank"
        rel="noopener"
      >
        <span className="pin">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.6a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2z" />
          </svg>
        </span>
        <span className="txt">
          <span className="visit-instruction">
            TO VISIT THIS SITE<br />CLICK THIS LOCATION <span className="pointer"></span>
          </span>
          <span className="t">
            YELAHANKA NEWTOWN,
            <br />
            BANGALORE
          </span>
          <span className="rule" />
          <span className="go">OPEN IN MAPS</span>
        </span>
      </a>
      <div id="fail">
        This invitation needs WebGL, which this browser could not start. Try opening it in a current version of
        Chrome, Safari or Firefox.
      </div>
    </>
  );
}
