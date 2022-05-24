import { GetStaticProps } from 'next';
import React, { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header'
import {AiOutlineCalendar} from 'react-icons/ai';
import {BsFillPersonFill} from 'react-icons/bs';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR'
import  Head  from 'next/head';
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
}

export default function Home({postsPagination}:HomeProps): JSX.Element{
  const formatedPost = postsPagination.results.map( posts => {
    return {
      ...posts,
      first_publication_date: format(
        new Date(posts.first_publication_date),'dd MMM yyyy',
        {
          locale: ptBR
        }
      )
    }
  })
  const [posts, setPost] = useState<Post[]>(formatedPost);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function loadMorePost():Promise<void>{
      if (currentPage !== 1 && nextPage === null) {
        return;
      }

      const postResults = await fetch(`${nextPage}`).then(response => 
        response.json()
      );

      setNextPage(postResults.next_page);
      setCurrentPage(postResults.page);  
      
      const newPost = postResults.results.map( post => {
        return {
          uid: post.uid,
          first_publication_date: format(
            new Date(post.first_publication_date),'dd MMM yyyy',
            {
              locale: ptBR
            }
          ),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.actor,
          }
        }
      })

      setPost([...posts, ...newPost]);
  }


   return (
     <>
     <Head>
       <title>Home | Blog</title>
     </Head>
     <main className={commonStyles.container}>
      <Header/>
      <div className={styles.posts}>
        {posts.map( post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
          <a className={styles.post}> 
            <strong>{post.data.title}</strong>
            <p>{post.data.subtitle}</p>
            <ul>
              <li>
                <AiOutlineCalendar/> {post.first_publication_date}
              </li>
              <li>
                <BsFillPersonFill/> {post.data.author}
              </li>
            </ul>
          </a>
        </Link>
        ))}
      </div>
      {nextPage ? (
       <button onClick={loadMorePost} className={styles.loadMore}>Carregar mais posts</button>
      ) : <span className={styles.loadMore} >Você já carregou todos os posts</span>}  
     </main>
     </>
   )
 }

 export const getStaticProps: GetStaticProps = async () => {
    const prismic = getPrismicClient();
    const postsResponse = await prismic.query(
      [Prismic.predicates.at('document.type', 'posts')], {
        pageSize: 1,
      }
    );

     const posts = postsResponse.results.map( post => {
       return {
         uid: post.uid,
         first_publication_date: post.first_publication_date,
         data: {
           title: post.data.title,
           subtitle: post.data.subtitle,
           author: post.data.author,
         }
       }
     })

     console.log(postsResponse.results)

     const postsPagination = {
        next_page: postsResponse.next_page,
        results: posts,
     }


    return {
      props : {
        postsPagination
      }
    }
 };
