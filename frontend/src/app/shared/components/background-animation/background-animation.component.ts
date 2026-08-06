import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { MotionState } from '../../services/motion-state.service';

/**
 * Luxury ambient background — softly drifting, glowing mesh/orbs rendered on
 * a single <canvas> (zero bundle bloat, no third-party deps).
 *
 * Performance: pre-rendered radial-gradient sprites (no per-frame gradient
 * allocation), DPR capped at 1.5, orb/dust counts scale with viewport area,
 * the rAF loop pauses when the tab is hidden, and prefers-reduced-motion
 * renders one static frame instead of animating. Purely decorative —
 * pointer events pass through.
 */
interface Orb {
  sprite: HTMLCanvasElement;
  x: number;
  y: number;
  r: number;
  depth: number;
  driftAmp: number;
  speed: number;
  phase: number;
  pulseSpeed: number;
  baseAlpha: number;
}

interface Dust {
  x: number;
  y: number;
  r: number;
  speed: number;
  swayAmp: number;
  phase: number;
  alpha: number;
  twinkle: number;
}

type Rgb = [number, number, number];

const GOLD: Rgb = [240, 192, 79];
const GOLD_LIGHT: Rgb = [249, 221, 142];
const BLUE: Rgb = [56, 189, 248];
const INDIGO: Rgb = [70, 96, 158];

const ORB_PALETTE: Rgb[] = [GOLD, GOLD_LIGHT, BLUE, INDIGO, GOLD];
const DUST_COLORS = ['#f5cf6e', '#eaf1fb', '#f9dd8e'];
const MAX_DPR = 1.5;
const PARALLAX_PX = 34;

@Component({
  selector: 'app-background-animation',
  standalone: true,
  template: `<canvas class="background-animation__canvas" aria-hidden="true"></canvas>`,
  styleUrl: './background-animation.component.scss',
})
export class BackgroundAnimationComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionState);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>(
    'background-animation__canvas',
  );

  private ctx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private startTime = performance.now();
  private rafId = 0;
  private running = false;
  private destroyed = false;
  private reduced = false;
  private pointerX = 0.5;
  private pointerY = 0.5;

  private orbs: Orb[] = [];
  private dust: Dust[] = [];

  private readonly resizeObserver = new ResizeObserver(() => this.resize());

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) {
      this.stop();
    } else if (!this.reduced) {
      this.start();
    }
  };

  private readonly onPointerMove = (e: MouseEvent): void => {
    if (!this.motion.desktopPointer() || this.reduced) return;
    this.pointerX = e.clientX / window.innerWidth;
    this.pointerY = e.clientY / window.innerHeight;
  };

  constructor() {
    effect(() => {
      const reduced = this.motion.reduced();
      if (reduced === this.reduced) return;
      this.reduced = reduced;
      if (reduced) {
        this.stop();
        this.renderFrame(this.startTime);
      } else {
        this.start();
      }
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    this.ctx = canvas.getContext('2d');

    this.resizeObserver.observe(this.host.nativeElement);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('mousemove', this.onPointerMove, { passive: true });

    this.resize();
    this.start();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stop();
    this.resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('mousemove', this.onPointerMove);
  }

  private resize(): void {
    const hostEl = this.host.nativeElement;
    this.width = hostEl.clientWidth || window.innerWidth;
    this.height = hostEl.clientHeight || window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;
    canvas.width = Math.round(this.width * this.dpr);
    canvas.height = Math.round(this.height * this.dpr);

    this.buildOrbs();
    this.buildDust();

    if (this.reduced || !this.running) {
      this.renderFrame(this.startTime);
    }
  }

  private buildOrbs(): void {
    const area = this.width * this.height;
    const count = Math.max(4, Math.min(8, Math.round(area / 380000)));
    const baseSize = Math.max(140, Math.min(this.width, this.height));

    this.orbs = Array.from({ length: count }, (_, i) => {
      const r = baseSize * (0.2 + Math.random() * 0.16);
      const color = ORB_PALETTE[i % ORB_PALETTE.length];
      return {
        sprite: this.makeOrbSprite(color, r),
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        r,
        depth: 0.35 + Math.random() * 0.65,
        driftAmp: r * (0.3 + Math.random() * 0.25),
        speed: 0.05 + Math.random() * 0.07,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.16 + Math.random() * 0.2,
        baseAlpha: 0.12 + Math.random() * 0.14,
      };
    });
  }

  private makeOrbSprite([r, g, b]: Rgb, radius: number): HTMLCanvasElement {
    const size = Math.ceil(radius * 2 * this.dpr);
    const sprite = document.createElement('canvas');
    sprite.width = size;
    sprite.height = size;
    const sctx = sprite.getContext('2d');
    if (!sctx) return sprite;

    const cx = size / 2;
    const gradient = sctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
    gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.32)`);
    gradient.addColorStop(0.72, `rgba(${r}, ${g}, ${b}, 0.08)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    sctx.fillStyle = gradient;
    sctx.fillRect(0, 0, size, size);
    return sprite;
  }

  private buildDust(): void {
    const area = this.width * this.height;
    const count = Math.max(24, Math.min(60, Math.round(area / 26000)));
    this.dust = Array.from({ length: count }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      r: 0.8 + Math.random() * 1.6,
      speed: 6 + Math.random() * 14,
      swayAmp: 8 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.12 + Math.random() * 0.35,
      twinkle: 0.8 + Math.random() * 2.4,
    }));
  }

  private start(): void {
    if (this.reduced || this.running || this.destroyed || !this.ctx) return;
    this.running = true;
    this.rafId = requestAnimationFrame(this.loop);
  }

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private loop = (now: number): void => {
    if (!this.running || this.destroyed) return;
    this.renderFrame(now);
    this.rafId = requestAnimationFrame(this.loop);
  };

  private renderFrame(now: number): void {
    const ctx = this.ctx;
    if (!ctx || this.width <= 0 || this.height <= 0) return;

    const t = (now - this.startTime) / 1000;
    const { width, height, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const parX = (this.pointerX - 0.5) * PARALLAX_PX;
    const parY = (this.pointerY - 0.5) * PARALLAX_PX;

    for (const orb of this.orbs) {
      const x =
        orb.x + Math.sin(t * orb.speed + orb.phase) * orb.driftAmp + parX * orb.depth;
      const y =
        orb.y +
        Math.cos(t * orb.speed * 0.8 + orb.phase * 1.7) * orb.driftAmp * 0.8 +
        parY * orb.depth;
      const alpha = orb.baseAlpha * (0.72 + 0.28 * Math.sin(t * orb.pulseSpeed + orb.phase));
      ctx.globalAlpha = Math.max(0, Math.min(alpha, 0.4));
      ctx.drawImage(orb.sprite, x - orb.r, y - orb.r, orb.r * 2, orb.r * 2);
    }

    const span = height + 24;
    for (const d of this.dust) {
      const drift = d.x + Math.sin(t * d.twinkle + d.phase) * d.swayAmp;
      const rise = (((d.y - t * d.speed) % span) + span) % span - 12;
      const alpha = d.alpha * (0.5 + 0.5 * Math.sin(t * d.twinkle * 2 + d.phase));
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = DUST_COLORS[Math.floor(d.phase) % DUST_COLORS.length];
      ctx.beginPath();
      ctx.arc(drift, rise, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
}
