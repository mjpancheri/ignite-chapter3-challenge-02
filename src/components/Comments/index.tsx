import { useEffect } from 'react';
import styles from './comments.module.scss';

export default function Comments(): JSX.Element {
  useEffect(() => {
    //     <script src="https://utteranc.es/client.js"
    //         repo="mjpancheri / ignite-chapter3-challenge-02"
    //         issue-term="url"
    //         theme="github-dark"
    //         crossorigin="anonymous"
    //         async>
    // </script>
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute('repo', 'mjpancheri/ignite-chapter3-challenge-02');
    script.setAttribute('issue-term', 'url');
    script.setAttribute('theme', 'github-dark');
    anchor.appendChild(script);
  }, []);

  return (
    <div
      id="inject-comments-for-uterances"
      className={styles.commentsContainer}
    />
  );
}
