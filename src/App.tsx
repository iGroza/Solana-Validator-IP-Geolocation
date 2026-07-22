import { LocaleProvider } from './i18n';
import { ValidatorsProvider } from './state/ValidatorsContext';
import { ToastProvider } from './components/common/Toast';
import { AuroraBackground } from './components/common/AuroraBackground';
import { TopGithub } from './components/layout/TopGithub';
import { Nav } from './components/layout/Nav';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ReplayBar } from './components/validators/ReplayBar';

export default function App() {
  return (
    <LocaleProvider>
      <ValidatorsProvider>
        <ToastProvider>
          <div className="app-shell">
            <AuroraBackground />
            <TopGithub />
            <Nav />
            <main>
              <HomePage />
            </main>
            <Footer />
            {/* Fixed music-player-style replay bar — always visible, above all. */}
            <ReplayBar />
          </div>
        </ToastProvider>
      </ValidatorsProvider>
    </LocaleProvider>
  );
}
