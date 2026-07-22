import { GITHUB_URL } from '../../config';

/** Fixed corner link to the GitHub repository. */
export const TopGithub = () => (
  <a
    href={GITHUB_URL}
    target="_blank"
    rel="noopener noreferrer"
    className="top-github"
    aria-label="View on GitHub"
    title="View on GitHub"
  >
    <i className="fa-brands fa-github" aria-hidden="true" />
    <span>GitHub</span>
  </a>
);
