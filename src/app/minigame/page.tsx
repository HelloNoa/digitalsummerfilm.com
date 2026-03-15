import styles from './page.module.css';
import NoSignal from '@/components/layout/no_signal/no_signal';
import FlappyBaby from '@/components/layout/minigame/baby';

export default function Works() {
  return (
    <div className={styles.page}>
      <div style={{
        width: '100%',
        height: '70vh'
      }}>
        <FlappyBaby/>
      </div>
    </div>
  );
}
