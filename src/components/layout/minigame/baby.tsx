"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const GRAVITY = 0.4;
const SPEED = 11;
const GAME_WIDTH = 700;
const GAME_HEIGHT = 700;
const STONE_W = 100;
const STONE_H = 70;
const WALL_PADDING = 80;

const FIELD_TOP = WALL_PADDING;
const FIELD_BOTTOM = GAME_HEIGHT - WALL_PADDING;
const FIELD_LEFT = WALL_PADDING / 2;
const FIELD_RIGHT = GAME_WIDTH - WALL_PADDING / 2;

type GameState = "idle" | "playing" | "dead";

const BabySVG = ({ size = 40 }: { size?: number }) => (
  <svg width={size * 0.75} height={size} viewBox="0 0 56 75" fill="none">
    <ellipse cx="28" cy="14" rx="12" ry="13" fill="white" />
    <ellipse cx="24" cy="40" rx="14" ry="18" fill="white" />
    <ellipse cx="22" cy="42" rx="3" ry="4" fill="black" />
    <ellipse cx="16" cy="58" rx="8" ry="6" fill="white" transform="rotate(-20 16 58)" />
    <ellipse cx="32" cy="62" rx="6" ry="5" fill="white" transform="rotate(10 32 62)" />
  </svg>
);

export default function FlappyBaby() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [count, setCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [renderPos, setRenderPos] = useState({
                                               x: GAME_WIDTH / 2 - STONE_W / 2,
                                               y: GAME_HEIGHT / 2 - STONE_H / 2,
                                             });
  
  const velRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({
                          x: GAME_WIDTH / 2 - STONE_W / 2,
                          y: GAME_HEIGHT / 2 - STONE_H / 2,
                        });
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const countRef = useRef(0);
  const gameStateRef = useRef<GameState>("idle");
  
  // fieldRef: the white play field div, used to convert click coords
  const fieldRef = useRef<HTMLDivElement>(null);
  
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };
  
  const resetState = useCallback(() => {
    const initPos = {
      x: GAME_WIDTH / 2 - STONE_W / 2,
      y: GAME_HEIGHT / 2 - STONE_H / 2,
    };
    posRef.current = { ...initPos };
    velRef.current = { x: 0, y: 0 };
    countRef.current = 0;
    setRenderPos(initPos);
    setCount(0);
  }, []);
  
  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = Math.min((timestamp - lastTimeRef.current) / 16, 3);
    lastTimeRef.current = timestamp;
    
    velRef.current.y += GRAVITY * delta;
    posRef.current.x += velRef.current.x * delta;
    posRef.current.y += velRef.current.y * delta;
    
    // Bounce off left/right field walls
    if (posRef.current.x < FIELD_LEFT) {
      posRef.current.x = FIELD_LEFT;
      velRef.current.x = Math.abs(velRef.current.x) * 0.65;
    }
    if (posRef.current.x + STONE_W > FIELD_RIGHT) {
      posRef.current.x = FIELD_RIGHT - STONE_W;
      velRef.current.x = -Math.abs(velRef.current.x) * 0.65;
    }
    
    // Die on top/bottom
    if (posRef.current.y < FIELD_TOP || posRef.current.y + STONE_H > FIELD_BOTTOM) {
      posRef.current.y = Math.max(FIELD_TOP, Math.min(posRef.current.y, FIELD_BOTTOM - STONE_H));
      setRenderPos({ ...posRef.current });
      triggerShake();
      gameStateRef.current = "dead";
      setGameState("dead");
      return;
    }
    
    setRenderPos({ ...posRef.current });
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);
  
  // Click handler on the FIELD — we do manual hit-test against posRef
  const handleFieldClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!fieldRef.current) return;
      
      const rect = fieldRef.current.getBoundingClientRect();
      // Click position relative to field
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Stone bounds in field-local coords
      const sx = posRef.current.x - FIELD_LEFT;
      const sy = posRef.current.y - FIELD_TOP;
      
      const hitX = clickX >= sx && clickX <= sx + STONE_W;
      const hitY = clickY >= sy && clickY <= sy + STONE_H;
      
      if (!hitX || !hitY) return; // click missed the stone
      
      if (gameStateRef.current === "dead") {
        cancelAnimationFrame(animFrameRef.current);
        resetState();
        gameStateRef.current = "idle";
        setGameState("idle");
        return;
      }
      
      // Stone center in field-local coords
      const stoneCX = sx + STONE_W / 2;
      const stoneCY = sy + STONE_H / 2;
      
      const dx = stoneCX - clickX;
      const dy = stoneCY - clickY;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      
      velRef.current.x = (dx / len) * SPEED;
      velRef.current.y = (dy / len) * SPEED;
      
      if (gameStateRef.current === "idle") {
        gameStateRef.current = "playing";
        setGameState("playing");
        countRef.current = 1;
        setCount(1);
        lastTimeRef.current = 0;
        animFrameRef.current = requestAnimationFrame(gameLoop);
      } else {
        countRef.current += 1;
        setCount(countRef.current);
      }
    },
    [gameLoop, resetState]
  );
  
  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);
  
  const stoneLabel =
          gameState === "idle" ? "TOUCH!" : gameState === "dead" ? "RETRY" : undefined;
  
  // Stone position relative to field
  const stoneLeft = renderPos.x - FIELD_LEFT;
  const stoneTop = renderPos.y - FIELD_TOP;
  
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#000",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          backgroundColor: "#000",
          overflow: "hidden",
          animation: shake ? "shake 0.4s ease" : "none",
        }}
      >
        <style>{`
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            15%      { transform: translateX(-12px) rotate(-1deg); }
            30%      { transform: translateX(10px)  rotate(1deg); }
            45%      { transform: translateX(-8px); }
            60%      { transform: translateX(6px); }
            75%      { transform: translateX(-4px); }
            90%      { transform: translateX(2px); }
          }
          @keyframes float {
            0%,100% { transform: translateY(0px); }
            50%     { transform: translateY(-8px); }
          }
        `}</style>
        
        {/* Header */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: WALL_PADDING,
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            paddingLeft: 24,
            gap: 10,
            zIndex: 10,
          }}
        >
          <BabySVG size={36} />
          <span style={{ color: "white", fontSize: 28, fontWeight: 300, letterSpacing: 2 }}>
            {count}
          </span>
        </div>
        
        {/* Play field — handles ALL clicks, does manual hit-test */}
        <div
          ref={fieldRef}
          onClick={handleFieldClick}
          style={{
            position: "absolute",
            top: FIELD_TOP,
            left: FIELD_LEFT,
            right: FIELD_LEFT,
            bottom: WALL_PADDING,
            backgroundColor: "#fff",
            overflow: "hidden",
            cursor: "default",
          }}
        >
          {/* Stone */}
          <div
            style={{
              position: "absolute",
              left: stoneLeft,
              top: stoneTop,
              width: STONE_W,
              height: STONE_H,
              cursor: "pointer",
              userSelect: "none",
              animation: gameState === "idle" ? "float 2s ease-in-out infinite" : "none",
              pointerEvents: "none", // field handles clicks
            }}
          >
            <svg width={STONE_W} height={STONE_H} viewBox="0 0 100 70" fill="none">
              <path
                d="M10 35 C10 15 25 5 50 5 C75 5 90 15 90 35 C90 55 75 65 50 65 C25 65 10 55 10 35Z"
                fill="black"
              />
              {stoneLabel && (
                <text
                  x="50" y="40"
                  textAnchor="middle"
                  fill="white"
                  fontSize="15"
                  fontFamily="'Helvetica Neue', Arial, sans-serif"
                  fontWeight="300"
                  letterSpacing="2"
                >
                  {stoneLabel}
                </text>
              )}
            </svg>
          </div>
          
          {gameState === "dead" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                paddingTop: 24,
                pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: 12, letterSpacing: 3, color: "#000", opacity: 0.35, textTransform: "uppercase" }}>
                score: {count}
              </span>
            </div>
          )}
        </div>
        
        {/* Bottom wall */}
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: WALL_PADDING,
            backgroundColor: "#000",
          }}
        />
      </div>
    </div>
  );
}