"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const GRAVITY = 0.4;
const SPEED = 11;
const STONE_W = 100;
const STONE_H = 70;
const HEADER_H = 80; // top black bar
const FOOTER_H = 80; // bottom black bar
const SIDE_PAD = 40; // left/right black border

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
  const [renderPos, setRenderPos] = useState({ x: 0, y: 0 });
  const [fieldSize, setFieldSize] = useState({ w: 0, h: 0 });
  
  const velRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 }); // in field-local px
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const countRef = useRef(0);
  const gameStateRef = useRef<GameState>("idle");
  const fieldRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Compute field size from container
  const updateFieldSize = useCallback(() => {
    if (!containerRef.current) return;
    const vw = containerRef.current.clientWidth;
    const vh = containerRef.current.clientHeight;
    const fw = Math.max(vw - SIDE_PAD * 2, 100);
    const fh = Math.max(vh - HEADER_H - FOOTER_H, 100);
    setFieldSize({ w: fw, h: fh });
    // Re-center stone if idle
    if (gameStateRef.current === "idle") {
      const cx = fw / 2 - STONE_W / 2;
      const cy = fh / 2 - STONE_H / 2;
      posRef.current = { x: cx, y: cy };
      setRenderPos({ x: cx, y: cy });
    }
  }, []);
  
  useEffect(() => {
    updateFieldSize();
    window.addEventListener("resize", updateFieldSize);
    return () => window.removeEventListener("resize", updateFieldSize);
  }, [updateFieldSize]);
  
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };
  
  const resetState = useCallback(() => {
    if (!fieldRef.current) return;
    const fw = fieldRef.current.clientWidth;
    const fh = fieldRef.current.clientHeight;
    const initPos = { x: fw / 2 - STONE_W / 2, y: fh / 2 - STONE_H / 2 };
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
    
    const fw = fieldRef.current?.clientWidth ?? 300;
    const fh = fieldRef.current?.clientHeight ?? 300;
    
    velRef.current.y += GRAVITY * delta;
    posRef.current.x += velRef.current.x * delta;
    posRef.current.y += velRef.current.y * delta;
    
    // Bounce left/right
    if (posRef.current.x < 0) {
      posRef.current.x = 0;
      velRef.current.x = Math.abs(velRef.current.x) * 0.65;
    }
    if (posRef.current.x + STONE_W > fw) {
      posRef.current.x = fw - STONE_W;
      velRef.current.x = -Math.abs(velRef.current.x) * 0.65;
    }
    
    // Die top/bottom
    if (posRef.current.y < 0 || posRef.current.y + STONE_H > fh) {
      posRef.current.y = Math.max(0, Math.min(posRef.current.y, fh - STONE_H));
      setRenderPos({ ...posRef.current });
      triggerShake();
      gameStateRef.current = "dead";
      setGameState("dead");
      return;
    }
    
    setRenderPos({ ...posRef.current });
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);
  
  // Shared interaction logic: given field-local (clickX, clickY)
  const handleInteraction = useCallback(
    (clickX: number, clickY: number) => {
      // Hit test against stone
      const sx = posRef.current.x;
      const sy = posRef.current.y;
      const hitX = clickX >= sx && clickX <= sx + STONE_W;
      const hitY = clickY >= sy && clickY <= sy + STONE_H;
      if (!hitX || !hitY) return;
      
      if (gameStateRef.current === "dead") {
        cancelAnimationFrame(animFrameRef.current);
        resetState();
        gameStateRef.current = "idle";
        setGameState("idle");
        return;
      }
      
      // Push away from click point
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
  
  const handleFieldClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      handleInteraction(e.clientX - rect.left, e.clientY - rect.top);
    },
    [handleInteraction]
  );
  
  const handleFieldTouch = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault(); // prevent scroll / double-tap zoom
      if (!fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      // Use first changed touch
      const touch = e.changedTouches[0];
      handleInteraction(touch.clientX - rect.left, touch.clientY - rect.top);
    },
    [handleInteraction]
  );
  
  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);
  
  const stoneLabel =
          gameState === "idle" ? "TOUCH!" : gameState === "dead" ? "RETRY" : undefined;
  
  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        touchAction: "none",
        userSelect: "none",
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
          height: HEADER_H,
          backgroundColor: "#000",
          display: "flex",
          alignItems: "center",
          paddingLeft: 24,
          gap: 10,
          flexShrink: 0,
          animation: shake ? "shake 0.4s ease" : "none",
        }}
      >
        <BabySVG size={36} />
        <span style={{ color: "white", fontSize: 28, fontWeight: 300, letterSpacing: 2 }}>
          {count}
        </span>
      </div>
      
      {/* Middle row: left border + field + right border */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          animation: shake ? "shake 0.4s ease" : "none",
        }}
      >
        <div style={{ width: SIDE_PAD, flexShrink: 0, backgroundColor: "#000" }} />
        
        {/* Play field */}
        <div
          ref={fieldRef}
          onClick={handleFieldClick}
          onTouchStart={handleFieldTouch}
          style={{
            flex: 1,
            position: "relative",
            backgroundColor: "#fff",
            overflow: "hidden",
            cursor: "default",
          }}
        >
          {/* Stone */}
          <div
            style={{
              position: "absolute",
              left: renderPos.x,
              top: renderPos.y,
              width: STONE_W,
              height: STONE_H,
              pointerEvents: "none",
              animation: gameState === "idle" ? "float 2s ease-in-out infinite" : "none",
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
          
          {/* Dead overlay */}
          {gameState === "dead" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                paddingTop: 20,
                pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: 12, letterSpacing: 3, color: "#000", opacity: 0.35, textTransform: "uppercase" }}>
                score: {count}
              </span>
            </div>
          )}
        </div>
        
        <div style={{ width: SIDE_PAD, flexShrink: 0, backgroundColor: "#000" }} />
      </div>
      
      {/* Footer */}
      <div
        style={{
          height: FOOTER_H,
          backgroundColor: "#000",
          flexShrink: 0,
          animation: shake ? "shake 0.4s ease" : "none",
        }}
      />
    </div>
  );
}