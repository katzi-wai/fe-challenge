import React, { useReducer, useState } from "react";
// import "./SlotMachine.css";
import SlotReel from "./components/SlotReel";
import CoinCounter from "./components/CoinCounter";
import SpinButton from "./components/SpinButton";
import Message from "./components/Message";

const symbols = ["🍒", "🍋", "🍊"];
const SPIN_COST = 10;
const STARTING_COINS = 100;

const initialState = {
  coins: STARTING_COINS,
  reels: ["❓", "❓", "❓"],
  message: "",
  gameOver: false
};

const getRandomSymbol = () => {
  const index = Math.floor(Math.random() * symbols.length);
  return symbols[index];
};

function reducer(state, action) {
  switch (action.type) {
    case "SPIN":
      if (state.coins < SPIN_COST) {
        return { ...state, message: "Not enough coins!" };
      }
      const reel1 = getRandomSymbol();
      const reel2 = getRandomSymbol();
      const reel3 = getRandomSymbol();
      const newReels = [reel1, reel2, reel3];
      const [a, b, c] = newReels;
      let winAmount = 0;
      let message = "😢 No win this time.";

      if (a === b && b === c) {
        winAmount = 50;
        message = `🎉 Jackpot! You won ${winAmount} coins!`;
      } else if (a === b || a === c || b === c) {
        winAmount = 20;
        message = `✨ Nice! 2 of a kind! You won ${winAmount} coins!`;
      }

      const updatedCoins = state.coins - SPIN_COST + winAmount;
      const gameOver = updatedCoins < SPIN_COST;

      return {
        coins: updatedCoins,
        reels: newReels,
        message: gameOver
          ? "💀 Game Over! You're out of coins."
          : message,
        gameOver
      };

    case "RESTART":
      return { ...initialState };

    default:
      return state;
  }
}

function SlotMachine() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isWinning, setIsWinning] = useState(false);

  const handleClick = () => {
    if (state.gameOver) {
      dispatch({ type: "RESTART" });
      setIsWinning(false);
      return;
    }

    setIsSpinning(true);
    setIsWinning(false);

    // Simulate spinning delay
    setTimeout(() => {
      dispatch({ type: "SPIN" });
      setIsSpinning(false);

      // If it’s a win, briefly show winning animation
      setTimeout(() => {
        const [a, b, c] = state.reels;
        if (a === b && b === c || a === b || a === c || b === c) {
          setIsWinning(true);
          setTimeout(() => setIsWinning(false), 1000); // reset win animation
        }
      }, 50);
    }, 800); // spin duration
  };

  return (
    <div className="slot-container">
      <h1>🎰 Slot Machine</h1>
      <SlotReel
        symbols={state.reels}
        isSpinning={isSpinning}
        isWinning={isWinning}
      />
      <CoinCounter coins={state.coins} />
      <SpinButton
        disabled={!state.gameOver && state.coins < SPIN_COST}
        gameOver={state.gameOver}
        onClick={handleClick}
      />
      <Message text={state.message} />
    </div>
  );
}

export default SlotMachine;
