import styles from './component.module.css';
import Image from 'next/image';

export default function Header() {
  
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <a href={'/'}>
          <img
            className={styles.logo}
            src="/logo/logo.svg"
            alt="Next.js logo"
            width={181}
            height={87}
            loading="lazy"
          />
        </a>
      </div>
      <ul className={styles.nav}>
        <li><a href={'works'}>WORKS</a></li>
        <li><a href={'about'}>ABOUT US</a></li>
        <li><a href={'contact'}>CONTACT</a></li>
        <li><a href={'minigame'}>MINI GAME</a></li>
      </ul>
    </header>
  );
}
