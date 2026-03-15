"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from 'next/image';

const GRAVITY = 0.2;
const SPEED = 16;
const HEADER_H = 70;
// const FOOTER_H = 70;
const FOOTER_H = 0;
// const SIDE_PAD = 36;
const SIDE_PAD = 0;

// 돌 크기: 필드 너비의 18% (최소 60px)
const STONE_RATIO = 0.18;

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
  const [stoneSize, setStoneSize] = useState({ w: 100, h: 70 });
  
  const velRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  // stoneSizeRef: 게임 루프에서 최신 돌 크기를 동기적으로 읽기 위해 사용
  const stoneSizeRef = useRef({ w: 100, h: 70 });
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
  
  const computeStoneSize = useCallback((fw: number) => {
    const w = Math.max(Math.round(fw * STONE_RATIO), 60);
    const h = Math.round(w * 0.7);
    return { w, h };
  }, []);
  
  const centerStone = useCallback(() => {
    const { fw, fh } = getFieldSize();
    const size = computeStoneSize(fw);
    stoneSizeRef.current = size;
    setStoneSize(size);
    const p = { x: fw / 2 - size.w / 2, y: fh / 2 - size.h / 2 };
    posRef.current = { ...p };
    setRenderPos({ ...p });
  }, [getFieldSize, computeStoneSize]);
  
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (gameStateRef.current === "idle") centerStone();
    });
    if (wrapperRef.current) obs.observe(wrapperRef.current);
    return () => obs.disconnect();
  }, [centerStone]);
  
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
  
  const gameLoop = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = Math.min((timestamp - lastTimeRef.current) / 16, 3);
      lastTimeRef.current = timestamp;
      
      const { fw, fh } = getFieldSize();
      const { w: sw, h: sh } = stoneSizeRef.current;
      
      velRef.current.y += GRAVITY * delta;
      posRef.current.x += velRef.current.x * delta;
      posRef.current.y += velRef.current.y * delta;
      
      // 좌우 바운스
      if (posRef.current.x < 0) {
        posRef.current.x = 0;
        velRef.current.x = Math.abs(velRef.current.x) * 0.65;
      }
      if (posRef.current.x + sw > fw) {
        posRef.current.x = fw - sw;
        velRef.current.x = -Math.abs(velRef.current.x) * 0.65;
      }
      
      // 위아래 벽 = 게임 오버
      if (posRef.current.y < 0 || posRef.current.y + sh > fh) {
        posRef.current.y = Math.max(0, Math.min(posRef.current.y, fh - sh));
        setRenderPos({ ...posRef.current });
        triggerShake();
        gameStateRef.current = "dead";
        setGameState("dead");
        return;
      }
      
      setRenderPos({ ...posRef.current });
      animFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [getFieldSize]
  );
  
  const handleInteraction = useCallback(
    (clickX: number, clickY: number) => {
      const sx = posRef.current.x;
      const sy = posRef.current.y;
      const { w: sw, h: sh } = stoneSizeRef.current;
      
      // 돌 히트 테스트
      if (clickX < sx || clickX > sx + sw || clickY < sy || clickY > sy + sh) return;
      
      if (gameStateRef.current === "dead") {
        resetState();
        gameStateRef.current = "idle";
        setGameState("idle");
        return;
      }
      
      // 클릭 위치 반대 방향으로 튕김
      const dx = sx + sw / 2 - clickX;
      const dy = sy + sh / 2 - clickY;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      velRef.current.x = 0;
      velRef.current.y = -SPEED;
      
      // if (len < 8) {
      //   velRef.current.x = 0;
      //   velRef.current.y = -SPEED;
      // } else {
      //   velRef.current.x = (dx / len) * SPEED;
      //   // Y: 항상 위로, X: 클릭 반대 방향
      //   // velRef.current.y = -Math.max(Math.abs(dy / len), 0.4) * SPEED;
      //   const { fw, fh } = getFieldSize();
      //   const yy = fw * 0.01 * 0.5;
      //   console.log(yy)
      //   velRef.current.y = -yy;
      // }
      
      const { fw, fh } = getFieldSize();
      const pw = fh * 0.01 * 0.5;
      const ph = fh * 0.01;
      // velRef.current.x = (dx / len) * SPEED;
      velRef.current.x = (dx / len) * SPEED * pw * 0.1;
      velRef.current.y = -Math.max(Math.abs(dy / len), 0.4) * SPEED * ph * 0.1;
      
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
  
  const stoneLabel =
          gameState === "idle" ? "TOUCH!" : gameState === "dead" ? "RETRY" : undefined;
  const { w: sw, h: sh } = stoneSize;
  const fontSize = Math.min(Math.max(Math.round(sw * 0.15), 10), 16);
  
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
      
      {/* 헤더 */}
      <div
        style={{
          height: HEADER_H,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          paddingLeft: 20,
          gap: 10,
        }}
      >
        
        <Image width={560 * 0.05} height={743 * 0.05} src={'/minigame/baby.png'} alt={"score icon"}/>
        {/*<BabySVG size={32} />*/}
        <span style={{ color: "white", fontSize: 24, fontWeight: 300, letterSpacing: 2 }}>
          {count}
        </span>
      </div>
      
      {/* 미들 (사이드 패딩 + 플레이 필드) */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ width: SIDE_PAD, flexShrink: 0 }} />
        
        {/* 플레이 필드 */}
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
          {/* 돌 */}
          <div
            style={{
              position: "absolute",
              left: renderPos.x,
              top: renderPos.y,
              width: sw,
              height: sh,
              pointerEvents: "none",
              animation: gameState === "idle" ? "float 2s ease-in-out infinite" : "none",
            }}
          >
            <Image width={sw} height={sh} src={'/minigame/stone.png'} alt={"dsd"}/>
            {/*<svg width={sw} height={sh} viewBox="0 0 100 70" fill="none">*/}
            {/*  <path*/}
            {/*    d="M10 35 C10 15 25 5 50 5 C75 5 90 15 90 35 C90 55 75 65 50 65 C25 65 10 55 10 35Z"*/}
            {/*    fill="black"*/}
            {/*  />*/}
            {/*  {stoneLabel && (*/}
            {/*    <text*/}
            {/*      x="50"*/}
            {/*      y="40"*/}
            {/*      textAnchor="middle"*/}
            {/*      fill="white"*/}
            {/*      fontSize={fontSize}*/}
            {/*      fontFamily="'Helvetica Neue', Arial, sans-serif"*/}
            {/*      fontWeight="300"*/}
            {/*      letterSpacing="2"*/}
            {/*    >*/}
            {/*      {stoneLabel}*/}
            {/*    </text>*/}
            {/*  )}*/}
            {/*</svg>*/}
          </div>
          
          {/* 게임 오버 스코어 */}
          {gameState === "dead" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                paddingTop: 16,
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: 3,
                  color: "#000",
                  opacity: 0.3,
                  textTransform: "uppercase",
                }}
              >
                score: {count}
              </span>
            </div>
          )}
        </div>
        
        <div style={{ width: SIDE_PAD, flexShrink: 0 }} />
      </div>
      
      {/* 푸터 */}
      <div style={{ height: FOOTER_H, flexShrink: 0 }} />
    </div>
  );
}