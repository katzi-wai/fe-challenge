import React from "react";
import "../assets/slotreel.css";

const SlotReel = ({ symbols, isSpinning, isWinning }) => (
  <div className={`reels ${isSpinning ? "spinning" : ""}`}>
    {symbols.map((symbol, idx) => (
      <div
        key={idx}
        className={`reel ${isWinning ? "win" : ""}`}
      >
        {symbol}
      </div>
    ))}
  </div>
);

export default SlotReel;
