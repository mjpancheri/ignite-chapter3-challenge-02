import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export function formatDate(date: string): string {
  return format(new Date(date), 'd MMM yyyy', {
    locale: ptBR,
  });
}

export function formatDateTime(date: string): string {
  return format(new Date(date), "d MMM yyyy, 'às' HH:mm", {
    locale: ptBR,
  });
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState(postsPagination.results);

  const handleLoadMorePosts = (): void => {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        // console.log(data.prev_page, data.next_page);
        const { next_page, results } = data;

        const newPosts = results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setNextPage(next_page);
        setPosts(posts.concat(newPosts));
      });
  };

  return (
    <>
      <Head>
        <title>Home | Spacetraveling.</title>
      </Head>

      <Header />

      <main className={commonStyles.container}>
        {posts.map(post => (
          <div key={post.uid} className={styles.post}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.info}>
                  <FiCalendar />
                  <time>{formatDate(post.first_publication_date)}</time>
                  <FiUser />
                  <span className={commonStyles.name}>{post.data.author}</span>
                </div>
              </a>
            </Link>
          </div>
        ))}
      </main>
      <footer className={styles.footer}>
        {nextPage && (
          <button
            className={styles.load_more}
            type="button"
            onClick={handleLoadMorePosts}
          >
            Carregar mais posts
          </button>
        )}
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

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      ref: previewData?.ref ?? null,
      pageSize: 1,
      orderings: '[document.last_publication_date]',
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
      preview,
    },
  };
};
