import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import {
  Gamepad2,
  Trophy,
  RotateCcw,
  Sparkles,
  Swords,
  Timer,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const TRIVIA_QUESTIONS = [
  {
    q: 'What is the average time complexity for searching an element in a Java HashMap?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
    correct: 0,
  },
  {
    q: 'Which protocol enables bidirectional, full-duplex communication in Socket.io?',
    options: ['HTTP/2', 'WebSocket', 'GraphQL', 'gRPC'],
    correct: 1,
  },
  {
    q: 'What type of database is MongoDB?',
    options: ['Relational SQL', 'Document-based NoSQL', 'Graph DB', 'Key-Value Redis'],
    correct: 1,
  },
  {
    q: 'Which React Hook is primarily used for managing WebSocket subscriptions and lifecycle side-effects?',
    options: ['useState', 'useMemo', 'useEffect', 'useCallback'],
    correct: 2,
  },
];

export const GameArenaModal = ({
  isOpen,
  onClose,
  roomId,
  opponent,
}) => {
  const { socket, addToast } = useSocket();
  const { user } = useAuth();

  const [activeGame, setActiveGame] = useState('tictactoe'); // 'tictactoe' | 'rps' | 'trivia'

  // Tic Tac Toe State
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [mySymbol, setMySymbol] = useState('X');
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ me: 0, opponent: 0, draws: 0 });

  // Rock Paper Scissors State
  const [myChoice, setMyChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [rpsWinner, setRpsWinner] = useState(null);
  const [rpsScores, setRpsScores] = useState({ me: 0, opponent: 0 });

  // Trivia State
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [triviaScore, setTriviaScore] = useState(0);

  // Setup game & listen for opponent moves
  useEffect(() => {
    if (!socket || !roomId || !isOpen) return;

    const handleGameMove = ({ moveData, player, gameType }) => {
      if (gameType === 'tictactoe') {
        const { index, symbol } = moveData;
        setBoard((prev) => {
          const newBoard = [...prev];
          newBoard[index] = symbol;
          checkWinner(newBoard);
          return newBoard;
        });
        setIsMyTurn(true);
      } else if (gameType === 'rps') {
        setOpponentChoice(moveData.choice);
      }
    };

    const handleGameRestarted = ({ gameType }) => {
      if (gameType === 'tictactoe') {
        resetTicTacToe();
      } else if (gameType === 'rps') {
        setMyChoice(null);
        setOpponentChoice(null);
        setRpsWinner(null);
      }
      addToast({ type: 'info', message: 'Game was restarted for a rematch!' });
    };

    socket.on('gameMoveUpdate', handleGameMove);
    socket.on('gameRestarted', handleGameRestarted);

    return () => {
      socket.off('gameMoveUpdate', handleGameMove);
      socket.off('gameRestarted', handleGameRestarted);
    };
  }, [socket, roomId, isOpen]);

  // Evaluate RPS Winner when both have picked
  useEffect(() => {
    if (myChoice && opponentChoice) {
      if (myChoice === opponentChoice) {
        setRpsWinner('Draw!');
      } else if (
        (myChoice === 'rock' && opponentChoice === 'scissors') ||
        (myChoice === 'paper' && opponentChoice === 'rock') ||
        (myChoice === 'scissors' && opponentChoice === 'paper')
      ) {
        setRpsWinner('You Won!');
        setRpsScores((prev) => ({ ...prev, me: prev.me + 1 }));
      } else {
        setRpsWinner(`${opponent?.name || 'Opponent'} Won!`);
        setRpsScores((prev) => ({ ...prev, opponent: prev.opponent + 1 }));
      }
    }
  }, [myChoice, opponentChoice, opponent]);

  // Tic Tac Toe Check Winner
  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        const winningSymbol = squares[a];
        const iWon = winningSymbol === mySymbol;
        setWinner(iWon ? 'You Win! 🎉' : `${opponent?.name || 'Opponent'} Wins! 🏆`);
        setScores((prev) => ({
          ...prev,
          me: iWon ? prev.me + 1 : prev.me,
          opponent: !iWon ? prev.opponent + 1 : prev.opponent,
        }));
        return;
      }
    }

    if (squares.every((sq) => sq !== null)) {
      setWinner('Game Draw! 🤝');
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
    }
  };

  const handleCellClick = (index) => {
    if (board[index] || winner || !isMyTurn) return;

    const newBoard = [...board];
    newBoard[index] = mySymbol;
    setBoard(newBoard);
    setIsMyTurn(false);
    checkWinner(newBoard);

    // Emit move to opponent
    socket?.emit('gameMove', {
      roomId,
      gameType: 'tictactoe',
      moveData: { index, symbol: mySymbol },
    });
  };

  const resetTicTacToe = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsMyTurn(true);
  };

  const handleRestart = () => {
    if (activeGame === 'tictactoe') {
      resetTicTacToe();
    } else if (activeGame === 'rps') {
      setMyChoice(null);
      setOpponentChoice(null);
      setRpsWinner(null);
    }
    socket?.emit('restartGame', { roomId, gameType: activeGame });
  };

  const handleRPSPick = (choice) => {
    setMyChoice(choice);
    socket?.emit('gameMove', {
      roomId,
      gameType: 'rps',
      moveData: { choice },
    });
  };

  const handleTriviaAnswer = (optIndex) => {
    setSelectedAnswer(optIndex);
    if (optIndex === TRIVIA_QUESTIONS[triviaIndex].correct) {
      setTriviaScore((prev) => prev + 10);
    }
    setTimeout(() => {
      setSelectedAnswer(null);
      if (triviaIndex < TRIVIA_QUESTIONS.length - 1) {
        setTriviaIndex((prev) => prev + 1);
      }
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎮 Multiplayer Game Arena"
      subtitle={`Live in-chat multiplayer duel with ${opponent?.name || 'your friend'}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Game Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveGame('tictactoe')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeGame === 'tictactoe'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⭕ Tic-Tac-Toe Live
          </button>
          <button
            onClick={() => setActiveGame('rps')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeGame === 'rps'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ✊ Rock-Paper-Scissors
          </button>
          <button
            onClick={() => setActiveGame('trivia')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeGame === 'trivia'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🧠 AI Tech Trivia
          </button>
        </div>

        {/* 1. Tic Tac Toe Game */}
        {activeGame === 'tictactoe' && (
          <div className="flex flex-col items-center space-y-4 py-2">
            {/* Score & Turn Banner */}
            <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-400">You ({mySymbol}):</span>
                <span className="font-mono text-slate-100 font-bold">{scores.me}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
                {winner ? (
                  <span className="text-emerald-400 font-bold">{winner}</span>
                ) : (
                  <span>{isMyTurn ? '👉 Your Turn' : `⏳ ${opponent?.name || "Opponent"}'s Turn`}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-400">{opponent?.name || 'Friend'} (O):</span>
                <span className="font-mono text-slate-100 font-bold">{scores.opponent}</span>
              </div>
            </div>

            {/* 3x3 Grid Board */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-2xl">
              {board.map((cell, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={cell !== null || winner !== null || !isMyTurn}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl text-3xl font-extrabold flex items-center justify-center transition-all duration-150 border select-none ${
                    cell === 'X'
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                      : cell === 'O'
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 cursor-pointer active:scale-95'
                  } disabled:cursor-not-allowed`}
                >
                  {cell}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRestart}
              icon={RotateCcw}
            >
              Rematch / Restart
            </Button>
          </div>
        )}

        {/* 2. Rock Paper Scissors Game */}
        {activeGame === 'rps' && (
          <div className="flex flex-col items-center space-y-5 py-3 text-center">
            <div className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="font-bold text-indigo-300">You: {rpsScores.me}</span>
              <span className="text-amber-400 font-bold">{rpsWinner || 'Choose your weapon!'}</span>
              <span className="font-bold text-purple-300">{opponent?.name || 'Friend'}: {rpsScores.opponent}</span>
            </div>

            <div className="flex items-center justify-center gap-4">
              {[
                { id: 'rock', emoji: '🪨', label: 'Rock' },
                { id: 'paper', emoji: '📄', label: 'Paper' },
                { id: 'scissors', emoji: '✂️', label: 'Scissors' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleRPSPick(item.id)}
                  disabled={myChoice !== null}
                  className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border text-3xl transition-all ${
                    myChoice === item.id
                      ? 'bg-indigo-600/30 border-indigo-500 scale-105 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:scale-105 active:scale-95'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span className="text-xs font-semibold text-slate-300 mt-1">{item.label}</span>
                </button>
              ))}
            </div>

            {myChoice && !opponentChoice && (
              <p className="text-xs text-amber-400 italic animate-pulse">
                You chose {myChoice.toUpperCase()}! Waiting for {opponent?.name || 'opponent'} to pick...
              </p>
            )}

            {myChoice && opponentChoice && (
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <p className="text-sm font-bold text-slate-100">{rpsWinner}</p>
                <p className="text-xs text-slate-400">
                  You picked <span className="text-indigo-300 font-semibold">{myChoice}</span> vs {opponent?.name || 'Opponent'} picked <span className="text-purple-300 font-semibold">{opponentChoice}</span>
                </p>
                <Button variant="ai" size="sm" onClick={handleRestart} icon={RotateCcw} className="mt-2">
                  Play Next Round
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 3. AI Trivia Challenge */}
        {activeGame === 'trivia' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="font-semibold text-indigo-400">Question {triviaIndex + 1}/{TRIVIA_QUESTIONS.length}</span>
              <span className="font-bold text-emerald-400">Score: {triviaScore} pts</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-850 space-y-3">
              <h4 className="text-sm font-bold text-slate-100 leading-relaxed">
                {TRIVIA_QUESTIONS[triviaIndex].q}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {TRIVIA_QUESTIONS[triviaIndex].options.map((opt, i) => {
                  const isSelected = selectedAnswer === i;
                  const isCorrect = i === TRIVIA_QUESTIONS[triviaIndex].correct;
                  return (
                    <button
                      key={i}
                      onClick={() => handleTriviaAnswer(i)}
                      disabled={selectedAnswer !== null}
                      className={`p-3 rounded-xl border text-xs text-left font-medium transition-all ${
                        selectedAnswer !== null
                          ? isCorrect
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold'
                            : isSelected
                            ? 'bg-rose-600/30 border-rose-500 text-rose-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-500'
                          : 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-indigo-500/40 text-slate-200 active:scale-98'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Exit Arena
          </Button>
        </div>
      </div>
    </Modal>
  );
};
