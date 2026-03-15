import styles from './page.module.css';
import NoSignal from '@/components/layout/no_signal/no_signal';
import FlappyBaby from '@/components/layout/minigame/baby';

export default function Works() {
  return (
    <div className={styles.page}>
      <FlappyBaby/>
    </div>
  );
}
