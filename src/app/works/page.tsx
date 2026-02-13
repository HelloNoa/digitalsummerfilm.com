import styles from './page.module.css';

export default function Contact() {
  return (
    <div className={styles.page}>
      <img
        src="/detail/detail_1.png"
        alt="main detail image"
        loading="lazy"
      />
      <hr/>
      <img
        src="/detail/detail_2.png"
        alt="main detail image"
        loading="lazy"
      />
    </div>
  );
}
