import { APP_NAME, GITHUB_URL } from '../../config';
import { useScrollSpy } from '../../hooks/useScrollSpy';
import { useI18n } from '../../i18n';
import './Nav.css';

const SECTIONS = [
  { id: 'overview', key: 'nav.overview', fallback: 'Overview' },
  { id: 'map', key: 'nav.map', fallback: 'Map' },
  { id: 'charts', key: 'nav.charts', fallback: 'Charts' },
  { id: 'table', key: 'nav.data', fallback: 'Data' },
] as const;

const SECTION_IDS = SECTIONS.map((s) => s.id);

export const Nav = () => {
  const { t, locale, setLocale } = useI18n();
  const active = useScrollSpy(SECTION_IDS);

  return (
    <header className="nav">
      <div className="container">
        <nav className="nav__bar" aria-label="Primary">
          <a href="#overview" className="nav__brand" aria-label={`${APP_NAME} — back to top`}>
            <span className="nav__mark" aria-hidden="true">
              <i className="fa-solid fa-diagram-project" />
            </span>
            <span className="nav__name">Solana · Validator Geo</span>
          </a>

          <div className="nav__links">
            {SECTIONS.map(({ id, key, fallback }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`nav__link${active === id ? ' is-active' : ''}`}
                aria-current={active === id ? 'true' : undefined}
              >
                {t(key, fallback)}
              </a>
            ))}
          </div>

          <button
            type="button"
            className="nav__lang"
            aria-label={locale === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            title={locale === 'ru' ? 'English' : 'Русский'}
            onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
          >
            {locale === 'ru' ? 'EN' : 'RU'}
          </button>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--ghost btn--sm nav__github"
          >
            <i className="fa-brands fa-github" aria-hidden="true" />
            <span>GitHub</span>
          </a>
        </nav>
      </div>
    </header>
  );
};
