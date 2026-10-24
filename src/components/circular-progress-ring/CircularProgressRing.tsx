import { useEffect, useId, useState } from 'react';

import styles from './CircularProgressRing.module.scss';

/** Outer diameter of the SVG ring in pixels. */
export const RING_SIZE = 76;
const STROKE_WIDTH = 7;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** True when the user prefers reduced motion (SSR-safe). */
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/** Properties for an animated percentage progress ring. */
export type CircularProgressRingProps = {
  readonly value: number;
  readonly label: string;
  readonly displayValue: string;
  readonly animationDelayMs?: number;
};

/**
 * SVG ring fill via stroke-dashoffset. Animation starts from a full offset
 * (empty ring) and eases to the target; reduced-motion skips the transition.
 */
export const CircularProgressRing = ({
  value,
  label,
  displayValue,
  animationDelayMs = 0,
}: CircularProgressRingProps) => {
  const labelId = useId();
  /** Clamp value to 0–100 and compute the target dash offset. */
  const fillRatio = Math.min(Math.max(value, 0), 100) / 100;
  const targetOffset = CIRCUMFERENCE * (1 - fillRatio);
  const [strokeOffset, setStrokeOffset] = useState(CIRCUMFERENCE);
  const [animate, setAnimate] = useState(false);

  /** Drive ring animation (or jump to target when reduced motion is on). */
  useEffect(() => {
    if (prefersReducedMotion()) {
      setAnimate(false);
      setStrokeOffset(targetOffset);
      return undefined;
    }

    setAnimate(false);
    setStrokeOffset(CIRCUMFERENCE);

    const startTimer = window.setTimeout(() => {
      setAnimate(true);
      setStrokeOffset(targetOffset);
    }, animationDelayMs);

    return () => {
      window.clearTimeout(startTimer);
    };
  }, [animationDelayMs, targetOffset]);

  return (
    <div className={styles.item}>
      {/* Ring graphic with centred display value */}
      <div className={styles.ringWrap} role="img" aria-label={`${label}: ${displayValue}`}>
        <svg
          className={styles.svg}
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          aria-hidden="true"
        >
          <circle
            className={styles.track}
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Progress stroke only when there is a positive fill */}
          {fillRatio > 0 ? (
            <circle
              className={animate ? styles.progressAnimated : styles.progress}
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
            />
          ) : null}
        </svg>
        <span className={styles.value} aria-hidden="true">
          {displayValue}
        </span>
      </div>
      <p id={labelId} className={styles.label}>
        {label}
      </p>
    </div>
  );
};

/** Visual tone for a non-numeric status circle. */
export type StatusCircleTone = 'good' | 'fair' | 'poor' | 'neutral';

/** Properties for a categorical status circle (rating text, not a percentage). */
export type StatusCircleProps = {
  readonly status: string;
  readonly label: string;
  readonly tone?: StatusCircleTone;
};

/** Maps status tone keys to style classes. */
const statusToneClassName: Record<StatusCircleTone, string> = {
  good: styles.toneGood,
  fair: styles.toneFair,
  poor: styles.tonePoor,
  neutral: styles.toneNeutral,
};

/** Circular status chip for categorical affordability ratings. */
export const StatusCircle = ({ status, label, tone = 'neutral' }: StatusCircleProps) => {
  const labelId = useId();

  return (
    <div className={styles.item}>
      {/* Toned status circle with visible status text */}
      <div
        className={`${styles.statusWrap} ${statusToneClassName[tone]}`}
        role="status"
        aria-label={`${label}: ${status}`}
      >
        <span className={styles.statusOutline} aria-hidden="true" />
        <span className={styles.statusValue} aria-hidden="true">
          {status}
        </span>
      </div>
      <p id={labelId} className={styles.label}>
        {label}
      </p>
    </div>
  );
};

export default CircularProgressRing;
