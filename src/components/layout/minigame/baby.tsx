"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const GRAVITY = 0.4;
const SPEED = 16;
const STONE_W = 100 * 2;
const STONE_H = 70 * 2;
const HEADER_H = 70;
const FOOTER_H = 70;
const SIDE_PAD = 36;

type GameState = "idle" | "playing" | "dead";

const BabySVG = ({ size = 36 }: { size?: number }) => (
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
  
  const velRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const countRef = useRef(0);
  const gameStateRef = useRef<GameState>("idle");
  const fieldRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const getFieldSize = useCallback(() => {
    if (!fieldRef.current) return { fw: 300, fh: 300 };
    return { fw: fieldRef.current.clientWidth, fh: fieldRef.current.clientHeight };
  }, []);
  
  const centerStone = useCallback(() => {
    const { fw, fh } = getFieldSize();
    const p = { x: fw / 2 - STONE_W / 2, y: fh / 2 - STONE_H / 2 };
    posRef.current = { ...p };
    setRenderPos({ ...p });
  }, [getFieldSize]);
  
  // Re-center on resize only when idle
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (gameStateRef.current === "idle") centerStone();
    });
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, [centerStone]);
  
  // Initial center after mount
  useEffect(() => {
    centerStone();
  }, [centerStone]);
  
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };
  
  const resetState = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    velRef.current = { x: 0, y: 0 };
    countRef.current = 0;
    setCount(0);
    centerStone();
  }, [centerStone]);
  
  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = Math.min((timestamp - lastTimeRef.current) / 16, 3);
    lastTimeRef.current = timestamp;
    
    const { fw, fh } = getFieldSize();
    
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
  }, [getFieldSize]);
  
  const handleInteraction = useCallback(
    (clickX: number, clickY: number) => {
      const sx = posRef.current.x;
      const sy = posRef.current.y;
      if (clickX < sx || clickX > sx + STONE_W || clickY < sy || clickY > sy + STONE_H) return;
      
      if (gameStateRef.current === "dead") {
        resetState();
        gameStateRef.current = "idle";
        setGameState("idle");
        return;
      }
      
      const dx = (sx + STONE_W / 2) - clickX;
      const dy = (sy + STONE_H / 2) - clickY;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      if (len < 8) {
        // 중앙 클릭: 무조건 위로
        velRef.current.x = 0;
        velRef.current.y = -SPEED;
      } else {
        velRef.current.x = (dx / len) * SPEED;
        // 돌 위쪽 클릭 → 위로, 아래쪽 클릭 → 약하게 위로 (항상 위 방향 보장)
        velRef.current.y = dy > 0 ? -(dy / len) * SPEED : SPEED * 0.3;
      }
      
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
  
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      handleInteraction(e.clientX - rect.left, e.clientY - rect.top);
    },
    [handleInteraction]
  );
  
  const handleTouch = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!fieldRef.current) return;
      const rect = fieldRef.current.getBoundingClientRect();
      const t = e.changedTouches[0];
      handleInteraction(t.clientX - rect.left, t.clientY - rect.top);
    },
    [handleInteraction]
  );
  
  useEffect(() => () => cancelAnimationFrame(animFrameRef.current), []);
  
  const stoneLabel = gameState === "idle" ? "TOUCH!" : gameState === "dead" ? "RETRY" : undefined;
  
  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        userSelect: "none",
        touchAction: "none",
        animation: shake ? "shake 0.4s ease" : "none",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-10px) rotate(-1deg); }
          30%      { transform: translateX(8px) rotate(1deg); }
          45%      { transform: translateX(-6px); }
          60%      { transform: translateX(5px); }
          75%      { transform: translateX(-3px); }
          90%      { transform: translateX(2px); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-8px); }
        }
      `}</style>
      
      {/* Header */}
      <div style={{
        height: HEADER_H,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        paddingLeft: 20,
        gap: 10,
      }}>
        <BabySVG size={32} />
        <span style={{ color: "white", fontSize: 24, fontWeight: 300, letterSpacing: 2 }}>
          {count}
        </span>
      </div>
      
      {/* Middle row */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ width: SIDE_PAD, flexShrink: 0 }} />
        
        {/* Play field */}
        <div
          ref={fieldRef}
          onClick={handleClick}
          onTouchStart={handleTouch}
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
          
          {gameState === "dead" && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: 16,
              pointerEvents: "none",
            }}>
              <span style={{
                fontSize: 11,
                letterSpacing: 3,
                color: "#000",
                opacity: 0.3,
                textTransform: "uppercase",
              }}>
                score: {count}
              </span>
            </div>
          )}
        </div>
        
        <div style={{ width: SIDE_PAD, flexShrink: 0 }} />
      </div>
      
      {/* Footer */}
      <div style={{ height: FOOTER_H, flexShrink: 0 }} />
    </div>
  );
}