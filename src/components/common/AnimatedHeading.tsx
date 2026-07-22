import { Fragment, useEffect, useRef, useState } from 'react';
import type { ElementType, ReactNode } from 'react';
import { animate, stagger } from 'animejs';

interface AnimatedHeadingProps {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  /** Extra content rendered after the animated text (e.g. an icon). */
  children?: ReactNode;
}

/**
 * Word/char stagger-reveal heading powered by anime.js v4.
 * SSR-safe: server renders plain text (no `will-animate`, chars visible);
 * animation is armed only after mount and guarded behind prefers-reduced-motion.
 */
export const AnimatedHeading = ({ text, as, className, children }: AnimatedHeadingProps) => {
  // Keep the public `as` prop constrained to intrinsic elements, but render
  // through ElementType to avoid TS blowing up on the huge JSX intrinsic union.
  const Tag = (as ?? 'h2') as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    setArmed(true);
  }, []);

  useEffect(() => {
    if (!armed) {
      return;
    }
    const element = ref.current;
    if (!element) {
      return;
    }
    const chars = Array.from(element.querySelectorAll<HTMLElement>('.char'));
    if (chars.length === 0) {
      return;
    }

    let animation: ReturnType<typeof animate> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }
        observer.disconnect();
        animation = animate(chars, {
          opacity: [0, 1],
          translateY: ['1.1em', '0em'],
          rotateZ: [4, 0],
          duration: 720,
          delay: stagger(24, { start: 60 }),
          ease: 'out(3)',
          onComplete: () => {
            element.classList.remove('will-animate');
          },
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
      animation?.pause();
    };
  }, [armed]);

  const words = text.split(' ');

  return (
    <Tag
      ref={ref as never}
      className={`anim-heading${armed ? ' will-animate' : ''}${className ? ` ${className}` : ''}`}
      aria-label={text}
    >
      <span aria-hidden="true">
        {words.map((word, wordIndex) => (
          <Fragment key={wordIndex}>
            <span className="word">
              {Array.from(word).map((char, charIndex) => (
                <span className="char" key={charIndex}>
                  {char}
                </span>
              ))}
            </span>
            {wordIndex < words.length - 1 ? ' ' : ''}
          </Fragment>
        ))}
      </span>
      {children}
    </Tag>
  );
};
