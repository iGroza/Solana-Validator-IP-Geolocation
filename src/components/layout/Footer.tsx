import { APP_NAME, GITHUB_URL, REPO, RAW_CSV_URL } from '../../config';
import { useI18n } from '../../i18n';
import { useValidators } from '../../state/ValidatorsContext';

export const Footer = () => {
  const { t } = useI18n();
  const { lastUpdate } = useValidators();
  const year = new Date().getFullYear();

  const lastUpdateLabel = lastUpdate
    ? new Date(lastUpdate).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <a href="#overview" className="footer__brand">
              {APP_NAME}
            </a>
            <p className="footer__tag">{t('footer.built')}</p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost btn--sm"
              style={{ marginTop: 'var(--sp-20)' }}
            >
              <i className="fa-brands fa-github" aria-hidden="true" />
              {REPO}
            </a>
          </div>

          <div className="footer__col">
            <h4>{t('nav.data')}</h4>
            <a href={RAW_CSV_URL} className="footer__link" download>
              solana_validators.csv
            </a>
            <a
              href={`${GITHUB_URL}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__link"
            >
              {t('download.history')}
            </a>
            <span className="footer__link">
              {t('hero.meta.lastUpdate')}: {lastUpdateLabel}
            </span>
          </div>

          <div className="footer__col">
            <h4>{t('footer.source')}</h4>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__link"
            >
              GitHub
            </a>
            <a
              href="https://explorer.solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer__link"
            >
              Solana Explorer
            </a>
          </div>
        </div>

        <div className="footer__bottom">
          <span className="footer__credit">
            © {year} · Powered with{' '}
            <span className="footer__heart" role="img" aria-label="love">
              ♥️
            </span>{' '}
            by{' '}
            <a
              href="https://github.com/iGroza"
              target="_blank"
              rel="noopener noreferrer"
            >
              @iGroza
            </a>
          </span>
          <span className="footer__disclaimer">
            Community project. Not affiliated with the Solana Foundation. Geolocation is
            approximate and derived from validator gossip IP addresses.
          </span>
        </div>
      </div>
    </footer>
  );
};
