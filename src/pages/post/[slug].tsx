import { useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';
import { formatDate } from '..';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: string;
      text: string;
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  const timeToRead = useMemo(() => {
    if (!post) {
      return 0;
    }

    const words = post.data.content
      .reduce((acc, item) => {
        return acc + item.heading + item.text;
      }, '')
      .split(/ /g);

    return Math.ceil(words.length / 200);
  }, [post]);

  function getUniqueKey(seed: string): string {
    const agora = new Date();
    return seed + Math.random() * agora.getTime();
  }

  if (isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>Post | Spacetraveling.</title>
      </Head>

      <Header />

      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <main className={commonStyles.container}>
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.info}>
            <FiCalendar />
            <time>{formatDate(post.first_publication_date)}</time>
            <FiUser />
            <span className={commonStyles.name}>{post.data.author}</span>
            <FiClock />
            <span className={commonStyles.clock}>
              {timeToRead > 0 ? `${timeToRead} min` : 'calculando...'}
            </span>
          </div>
          {post.data.content.map(content => (
            <article key={getUniqueKey('_c')}>
              <h2>{content.heading}</h2>
              <div
                key={getUniqueKey('_b')}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: content.body }}
              />
            </article>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    ...response, // Faço o spread aqui

    data: {
      ...response.data, // E aqui também
      title: response.data.title,
      banner: response.data.banner,
      author: response.data.author,

      content: response.data.content.map(item => {
        // eslint-disable-next-line no-param-reassign
        item.text = RichText.asText(item.body);
        // eslint-disable-next-line no-param-reassign
        item.body = RichText.asHtml(item.body);
        return item;
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24, // 1 dia
  };
};
