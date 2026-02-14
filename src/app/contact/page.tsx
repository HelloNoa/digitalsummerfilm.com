import styles from './page.module.css';

function diffInDays(target: Date) {
  const today = new Date();
  // 시간·타임존 영향 줄이려고 자정 기준으로 맞추기
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export default function Contact() {
  const target = new Date(2026, 1, 17); // month는 0 기반
  const diff = diffInDays(target);
  
  let label = '';
  if (diff > 0) label = `D-${diff}`;
  else if (diff === 0) label = 'D-DAY';
  else label = `D+${Math.abs(diff)}`;
  return (
    <div className={styles.page}>
      <h5>Email</h5>
      <h5>
        <a href="mailto:contact@digitalsummerfilm.com">contact@digitalsummerfilm.com</a>
      </h5>
      {/*<h5>*/}
      {/*  <a href="mailto:jsh@digitalsummerfilm.com">jsh@digitalsummerfilm.com</a>*/}
      {/*</h5>*/}
      <hr/>
      <h5>INSTAGRAM DM</h5>
      <h5><a href={'https://www.instagram.com/digitalsummer_film/'} target={'_blank'}>@digitalsummer_film</a></h5>
      <hr/>
      <h5>CALL</h5>
      <h5>+82 010-2002-2026</h5>
    </div>
  );
}
