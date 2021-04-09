import { useMemo, useEffect, useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';
import Comments from '../../components/Comments';
import { formatDate, formatDateTime } from '..';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}
interface PostProps {
  post: Post;
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  };
  preview: boolean;
}

export default function Post({
  post,
  navigation,
  preview,
}: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  const timeToRead = useMemo(() => {
    if (!post) {
      return 0;
    }

    const words = post.data.content
      .reduce((acc, item) => {
        return acc + item.heading + RichText.asText(item.body);
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
        <title>{post.data.title} | Spacetraveling.</title>
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
          {post.last_publication_date &&
            post.last_publication_date > post.first_publication_date && (
              <p className={commonStyles.edit}>
                {`* editado em ${formatDateTime(post.last_publication_date)}`}
              </p>
            )}
          {post.data.content.map(content => (
            <article key={getUniqueKey('_c')}>
              <h2>{content.heading}</h2>
              <div
                key={getUniqueKey('_b')}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}
        </div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.navigation}>
          {navigation?.prevPost.length > 0 ? (
            <Link href={`/post/${navigation.prevPost[0].uid}`}>
              <a className={styles.prev}>
                {navigation.prevPost[0].data.title.length > 35
                  ? `${navigation.prevPost[0].data.title.substring(0, 33)}...`
                  : navigation.prevPost[0].data.title}
                <p>Post anterior</p>
              </a>
            </Link>
          ) : (
            <div />
          )}
          {navigation?.nextPost.length > 0 ? (
            <Link href={`/post/${navigation.nextPost[0].uid}`}>
              <a className={styles.next}>
                {navigation.nextPost[0].data.title.length > 35
                  ? `${navigation.nextPost[0].data.title.substring(0, 33)}...`
                  : navigation.nextPost[0].data.title}
                <p>Próximo post</p>
              </a>
            </Link>
          ) : (
            <div />
          )}
        </div>

        <Comments />
        {preview && (
          <aside className={commonStyles.exit_preview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </footer>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.uid'],
      // pageSize: 1,
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date]',
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
      preview,
    },
    revalidate: 60 * 60 * 24, // 1 dia
  };
};
