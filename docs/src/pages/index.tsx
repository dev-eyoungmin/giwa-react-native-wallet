import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Translate, { translate } from '@docusaurus/Translate';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroBackground}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGrid} />
      </div>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.badgeIcon}>🚀</span>
            <Translate id="homepage.hero.badge">React Native SDK for GIWA Chain</Translate>
          </div>
          <h1 className={styles.heroTitle}>
            <Translate id="homepage.hero.title">GIWA Chain</Translate>
            <br />
            <span className={styles.heroTitleGradient}>
              <Translate id="homepage.hero.titleHighlight">Mobile SDK</Translate>
            </span>
          </h1>
          <p className={styles.heroSubtitle}>
            <Translate id="homepage.hero.subtitle">
              React Native SDK for GIWA Chain.
              Build mobile dApps with Flashblocks, GIWA ID, Dojang, and L1↔L2 Bridge.
            </Translate>
          </p>
          <div className={styles.heroButtons}>
            <Link className={styles.primaryButton} to="/docs">
              <Translate id="homepage.getStarted">Get Started</Translate>
              <span className={styles.buttonIcon}>→</span>
            </Link>
            <Link
              className={styles.secondaryButton}
              to="https://github.com/dev-eyoungmin/giwa-react-native-wallet"
            >
              <span className={styles.githubIcon}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </span>
              GitHub
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>~200ms</span>
              <span className={styles.statLabel}>
                <Translate id="homepage.stats.confirmation">Preconfirmation</Translate>
              </span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>10+</span>
              <span className={styles.statLabel}>
                <Translate id="homepage.stats.hooks">React Hooks</Translate>
              </span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>100%</span>
              <span className={styles.statLabel}>
                <Translate id="homepage.stats.typescript">TypeScript</Translate>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

interface FeatureItem {
  title: string;
  icon: string;
  description: string;
  gradient: string;
}

function useFeatures(): FeatureItem[] {
  return [
    {
      title: translate({ id: 'homepage.feature.easyInstall.title', message: 'Easy Installation' }),
      icon: '📦',
      description: translate({
        id: 'homepage.feature.easyInstall.description',
        message: 'One-line install for both Expo and React Native CLI. Get started in minutes.'
      }),
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: translate({ id: 'homepage.feature.secureWallet.title', message: 'Secure Storage' }),
      icon: '🔐',
      description: translate({
        id: 'homepage.feature.secureWallet.description',
        message: 'Hardware-backed security with iOS Keychain and Android Keystore integration.'
      }),
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: translate({ id: 'homepage.feature.fastTx.title', message: 'Flashblocks' }),
      icon: '⚡',
      description: translate({
        id: 'homepage.feature.fastTx.description',
        message: 'Ultra-fast ~200ms preconfirmation for instant transaction feedback.'
      }),
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: translate({ id: 'homepage.feature.giwaId.title', message: 'GIWA ID' }),
      icon: '🏷️',
      description: translate({
        id: 'homepage.feature.giwaId.description',
        message: 'Human-readable addresses with ENS-based naming like alice.giwa.id.'
      }),
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
      title: translate({ id: 'homepage.feature.bridge.title', message: 'L1↔L2 Bridge' }),
      icon: '🌉',
      description: translate({
        id: 'homepage.feature.bridge.description',
        message: 'Seamless asset transfers between Ethereum and GIWA Chain.'
      }),
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    {
      title: translate({ id: 'homepage.feature.typescript.title', message: 'TypeScript Native' }),
      icon: '💎',
      description: translate({
        id: 'homepage.feature.typescript.description',
        message: 'Full type safety with comprehensive TypeScript definitions.'
      }),
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    },
  ];
}

function Feature({ title, icon, description, gradient }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.featureIconWrapper} style={{ background: gradient }}>
          <span className={styles.featureIcon}>{icon}</span>
        </div>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

function HomepageFeatures() {
  const features = useFeatures();
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Translate id="homepage.features.title">GIWA Chain Features</Translate>
          </h2>
          <p className={styles.sectionSubtitle}>
            <Translate id="homepage.features.subtitle">
              All GIWA Chain features in one SDK for React Native
            </Translate>
          </p>
        </div>
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CodeExample() {
  const codeString = `import { GiwaProvider, useGiwaWallet } from '@giwa/react-native-wallet';

export default function App() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <WalletScreen />
    </GiwaProvider>
  );
}

function WalletScreen() {
  const { wallet, createWallet, isLoading } = useGiwaWallet();

  if (isLoading) return <ActivityIndicator />;

  return wallet ? (
    <Text>Connected: {wallet.address}</Text>
  ) : (
    <Button title="Create Wallet" onPress={createWallet} />
  );
}`;

  return (
    <section className={styles.codeSection}>
      <div className="container">
        <div className="row">
          <div className="col col--5">
            <div className={styles.codeInfo}>
              <h2 className={styles.codeTitle}>
                <Translate id="homepage.code.title">Simple & Intuitive API</Translate>
              </h2>
              <p className={styles.codeDescription}>
                <Translate id="homepage.code.description">
                  Get started with just a few lines of code. React Hooks for wallet, Flashblocks, GIWA ID, Dojang, and more.
                </Translate>
              </p>
              <ul className={styles.codeFeatures}>
                <li>
                  <span className={styles.checkIcon}>✓</span>
                  <Translate id="homepage.code.feature1">React Hooks for all features</Translate>
                </li>
                <li>
                  <span className={styles.checkIcon}>✓</span>
                  <Translate id="homepage.code.feature2">Automatic state management</Translate>
                </li>
                <li>
                  <span className={styles.checkIcon}>✓</span>
                  <Translate id="homepage.code.feature3">Built-in error handling</Translate>
                </li>
                <li>
                  <span className={styles.checkIcon}>✓</span>
                  <Translate id="homepage.code.feature4">TypeScript support</Translate>
                </li>
              </ul>
            </div>
          </div>
          <div className="col col--7">
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <div className={styles.codeDots}>
                  <span className={styles.codeDot} style={{ background: '#ff5f57' }} />
                  <span className={styles.codeDot} style={{ background: '#febc2e' }} />
                  <span className={styles.codeDot} style={{ background: '#28c840' }} />
                </div>
                <span className={styles.codeFilename}>App.tsx</span>
              </div>
              <pre className={styles.codeContent}>
                <code>{codeString}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InstallSection() {
  return (
    <section className={styles.installSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Translate id="homepage.install.title">Quick Installation</Translate>
          </h2>
          <p className={styles.sectionSubtitle}>
            <Translate id="homepage.install.subtitle">
              Choose your platform and get started in seconds
            </Translate>
          </p>
        </div>
        <div className={styles.installCards}>
          <div className={styles.installCard}>
            <div className={styles.installCardHeader}>
              <span className={styles.installIconSvg}>
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M0 20.084c.043.53.23 1.063.718 1.778.58.849 1.576 1.315 2.303.567.49-.505 5.794-9.776 8.35-13.29a.761.761 0 011.248 0c2.556 3.514 7.86 12.785 8.35 13.29.727.748 1.723.282 2.303-.567.57-.835.728-1.42.728-2.046 0-.426-8.26-15.798-9.092-17.078-.8-1.23-1.044-1.498-2.397-1.542h-1.032c-1.353.044-1.597.311-2.398 1.542C8.267 3.991.33 18.758 0 19.77Z"/>
                </svg>
              </span>
              <h3>Expo</h3>
            </div>
            <div className={styles.installCommands}>
              <div className={styles.installCommandRow}>
                <span className={styles.packageManager}>npm</span>
                <code>npm install @giwa/react-native-wallet expo-secure-store</code>
              </div>
              <div className={styles.installCommandRow}>
                <span className={styles.packageManager}>yarn</span>
                <code>yarn add @giwa/react-native-wallet expo-secure-store</code>
              </div>
              <div className={styles.installCommandRow}>
                <span className={styles.packageManager}>pnpm</span>
                <code>pnpm add @giwa/react-native-wallet expo-secure-store</code>
              </div>
            </div>
          </div>
          <div className={styles.installCard}>
            <div className={styles.installCardHeader}>
              <span className={styles.installIconSvg}>
                <svg viewBox="0 0 24 24" width="28" height="28" fill="#61DAFB">
                  <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z"/>
                </svg>
              </span>
              <h3>React Native CLI</h3>
            </div>
            <div className={styles.installCommands}>
              <div className={styles.installCommandRow}>
                <span className={styles.packageManager}>npm</span>
                <code>npm install @giwa/react-native-wallet react-native-keychain</code>
              </div>
              <div className={styles.installCommandRow}>
                <span className={styles.packageManager}>yarn</span>
                <code>yarn add @giwa/react-native-wallet react-native-keychain</code>
              </div>
              <div className={styles.installCommandRow}>
                <span className={styles.packageManager}>pnpm</span>
                <code>pnpm add @giwa/react-native-wallet react-native-keychain</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            <Translate id="homepage.cta.title">Ready to Build on GIWA Chain?</Translate>
          </h2>
          <p className={styles.ctaDescription}>
            <Translate id="homepage.cta.description">
              Start building your GIWA Chain mobile dApp today.
            </Translate>
          </p>
          <div className={styles.ctaButtons}>
            <Link className={styles.ctaPrimaryButton} to="/docs">
              <Translate id="homepage.cta.docs">Read the Docs</Translate>
            </Link>
            <Link
              className={styles.ctaSecondaryButton}
              to="https://github.com/dev-eyoungmin/giwa-react-native-wallet"
            >
              <Translate id="homepage.cta.github">View on GitHub</Translate>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="GIWA Chain SDK for React Native - Expo and React Native CLI compatible"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <CodeExample />
        <InstallSection />
        <CTASection />
      </main>
    </Layout>
  );
}
