import { AnimatedHeading } from './AnimatedHeading';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  lead?: string;
  headingAs?: keyof JSX.IntrinsicElements;
  align?: 'left' | 'center';
}

export const SectionHeader = ({
  eyebrow,
  title,
  lead,
  headingAs = 'h2',
  align = 'left',
}: SectionHeaderProps) => (
  <div className={`section-header section-header--${align}`}>
    {eyebrow ? (
      <span className="section-header__eyebrow" data-reveal>
        {eyebrow}
      </span>
    ) : null}
    <AnimatedHeading as={headingAs} text={title} className="heading section-header__title" />
    {lead ? (
      <p className="section-header__lead" data-reveal data-reveal-delay="1">
        {lead}
      </p>
    ) : null}
  </div>
);
