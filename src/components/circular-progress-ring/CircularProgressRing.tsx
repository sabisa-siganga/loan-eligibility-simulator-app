import { useEffect, useId, useState } from 'react';

import styles from './CircularProgressRing.module.scss';

export const RING_SIZE = 76;
const STROKE_WIDTH = 7;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

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
  const fillRatio = Math.min(Math.max(value, 0), 100) / 100;
  const targetOffset = CIRCUMFERENCE * (1 - fillRatio);
  const [strokeOffset, setStrokeOffset] = useState(CIRCUMFERENCE);
  const [animate, setAnimate] = useState(false);

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

export type StatusCircleTone = 'good' | 'fair' | 'poor' | 'neutral';

export type StatusCircleProps = {
  readonly status: string;
  readonly label: string;
  readonly tone?: StatusCircleTone;
};

const statusToneClassName: Record<StatusCircleTone, string> = {
  good: styles.toneGood,
  fair: styles.toneFair,
  poor: styles.tonePoor,
  neutral: styles.toneNeutral,
};

export const StatusCircle = ({ status, label, tone = 'neutral' }: StatusCircleProps) => {
  const labelId = useId();

  return (
    <div className={styles.item}>
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
