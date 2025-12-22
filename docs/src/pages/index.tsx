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
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs"
          >
            <Translate id="homepage.getStarted">Getting Started</Translate>
          </Link>
          <Link
            className="button button--outline button--lg"
            to="https://github.com/devym-37/giwa-react-native-wallet"
            style={{ marginLeft: '1rem' }}
          >
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

interface FeatureItem {
  title: string;
  emoji: string;
  description: string;
}

function useFeatures(): FeatureItem[] {
  return [
    {
      title: translate({ id: 'homepage.feature.easyInstall.title', message: 'Easy Installation' }),
      emoji: '📦',
      description: translate({
        id: 'homepage.feature.easyInstall.description',
        message: 'Supports both Expo and React Native CLI. Install with a single line and start using immediately.'
      }),
    },
    {
      title: translate({ id: 'homepage.feature.secureWallet.title', message: 'Secure Wallet' }),
      emoji: '🔐',
      description: translate({
        id: 'homepage.feature.secureWallet.description',
        message: 'OS-level secure storage using iOS Keychain and Android Keystore.'
      }),
    },
    {
      title: translate({ id: 'homepage.feature.fastTx.title', message: 'Fast Transactions' }),
      emoji: '⚡',
      description: translate({
        id: 'homepage.feature.fastTx.description',
        message: 'Pre-confirmation within ~200ms using Flashblocks.'
      }),
    },
    {
      title: translate({ id: 'homepage.feature.giwaId.title', message: 'GIWA ID' }),
      emoji: '🏷️',
      description: translate({
        id: 'homepage.feature.giwaId.description',
        message: 'ENS-based naming service. Simply use alice.giwa.id.'
      }),
    },
    {
      title: translate({ id: 'homepage.feature.bridge.title', message: 'L1↔L2 Bridge' }),
      emoji: '🌉',
      description: translate({
        id: 'homepage.feature.bridge.description',
        message: 'Asset transfer between Ethereum and GIWA Chain.'
      }),
    },
    {
      title: translate({ id: 'homepage.feature.typescript.title', message: 'TypeScript' }),
      emoji: '💎',
      description: translate({
        id: 'homepage.feature.typescript.description',
        message: 'Safe development experience with complete type support.'
      }),
    },
  ];
}

function Feature({ title, emoji, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="feature-card" style={{ height: '100%', marginBottom: '1rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{emoji}</div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function HomepageFeatures() {
  const features = useFeatures();
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickStart() {
  return (
    <section className={styles.quickStart}>
      <div className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Translate id="homepage.quickStart.title">Quick Start</Translate>
        </h2>
        <div className="row">
          <div className="col col--6">
            <h3>Expo</h3>
            <pre>
              <code>npx expo install @giwa/react-native-wallet expo-secure-store</code>
            </pre>
          </div>
          <div className="col col--6">
            <h3>React Native CLI</h3>
            <pre>
              <code>npm install @giwa/react-native-wallet react-native-keychain{'\n'}cd ios && pod install</code>
            </pre>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3>
            <Translate id="homepage.quickStart.basicUsage">Basic Usage</Translate>
          </h3>
          <pre>
            <code>{`import { GiwaProvider, useGiwaWallet } from '@giwa/react-native-wallet';

export default function App() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <WalletScreen />
    </GiwaProvider>
  );
}

function WalletScreen() {
  const { wallet, createWallet } = useGiwaWallet();

  return wallet ? (
    <Text>${translate({ id: 'homepage.quickStart.address', message: 'Address' })}: {wallet.address}</Text>
  ) : (
    <Button title="${translate({ id: 'homepage.quickStart.createWallet', message: 'Create Wallet' })}" onPress={createWallet} />
  );
}`}</code>
          </pre>
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
        <QuickStart />
      </main>
    </Layout>
  );
}
