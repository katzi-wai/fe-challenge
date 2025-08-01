import React from "react";

const SpinButton = ({ disabled, onClick, gameOver }) => (
  <button onClick={onClick} disabled={disabled}>
    {gameOver ? "🔄 Restart Game" : "Spin (10 coins)"}
  </button>
);

export default SpinButton;
