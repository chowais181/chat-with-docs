import { useRef, useState, useEffect } from 'react';
import React from 'react';
import Layout from '../components/layout';
// import LayoutChat from '../components/layoutChat';
import { getCookie } from 'cookies-next';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Chat() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hi, what would you like to know?',
        type: 'apiMessage',
      },
    ],
    history: [],
  });

  const [user, setUser] = useState<any>(null);

  console.log(user);

  const { messages, history } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Fetch user data first

    const fetchData = async () => {
      try {
        const response = await fetch('/api/user');
        const data = await response.json();
        if (data.error) {
          setError(data.error);
          return;
        } else {
          setUser(data);
        }
      } catch (error: any) {
        setLoading(false);
        setError(
          'An error occurred while fetching the data. Please try again.',
        );
        return;
      }
    };

    fetchData();
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();
    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          history,
          user,
        }),
      });
      const data = await response.json();
      // console.log('data', data);

      if (data.error) {
        setError(data.error);
      } else {
        setMessageState((state) => ({
          ...state,
          messages: [
            ...state.messages,
            {
              type: 'apiMessage',
              message: data.text,
              sourceDocs: data.sourceDocuments,
            },
          ],
          history: [...state.history, [question, data.text]],
        }));
      }
      // console.log('messageState', messageState);

      setLoading(false);

      //scroll to bottom
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
  }

  //prevent empty submissions
  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  // layout setting -------------------------
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const shouldShowMenuIcon = windowWidth < 768;

  // -----------------------------------------------

  return (
    <>
      <Layout pageTitle="Chat with docs">
        <Link href="/">Home</Link>
        <br />
        <div className="flex">
          {/* Sidebar */}
          <div
            className={`${
              isSidebarOpen || !shouldShowMenuIcon ? 'block' : 'hidden'
            } ${
              shouldShowMenuIcon ? 'fixed top-0 left-0 w-[280px]' : 'w-[280px]'
            } bg-gray-200 overflow-y-auto h-screen z-10`}
          >
            {/* Sidebar content */}
            <div className="p-4 mt-10">
              <br />
              <div className="text-black">
                {user &&
                  user?.files?.map((file: any, index: number) => (
                    <React.Fragment key={file.name}>
                      <p>{file?.name.split('.pdf')[0]}</p>
                      {index !== user.files.length - 1 && (
                        <hr className="my-2" />
                      )}
                    </React.Fragment>
                  ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {/* Toggle sidebar button */}
            {shouldShowMenuIcon && (
              <button
                className="fixed top-4 left-4 bg-gray-200 p-2 rounded-md text-black z-20"
                onClick={toggleSidebar}
              >
                {isSidebarOpen ? '✘' : '☰'}
              </button>
            )}

            {/* Chat content */}
            <div className="mx-auto flex flex-col gap-4">
              <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
                Chat With Your Docs
              </h1>
              <main className={styles.main}>
                <div className={styles.cloud}>
                  <div ref={messageListRef} className={styles.messagelist}>
                    {messages.map((message, index) => {
                      let icon;
                      let className;
                      if (message.type === 'apiMessage') {
                        icon = (
                          <Image
                            key={index}
                            src="/bot-image.png"
                            alt="AI"
                            width="40"
                            height="40"
                            className={styles.boticon}
                            priority
                          />
                        );
                        className = styles.apimessage;
                      } else {
                        icon = (
                          <Image
                            key={index}
                            src="/usericon.png"
                            alt="Me"
                            width="30"
                            height="30"
                            className={styles.usericon}
                            priority
                          />
                        );
                        // The latest message sent by the user will be animated while waiting for a response
                        className =
                          loading && index === messages.length - 1
                            ? styles.usermessagewaiting
                            : styles.usermessage;
                      }
                      return (
                        <>
                          <div
                            key={`chatMessage-${index}`}
                            className={className}
                          >
                            {icon}
                            <div className={styles.markdownanswer}>
                              <ReactMarkdown linkTarget="_blank">
                                {message.message}
                              </ReactMarkdown>
                            </div>
                          </div>
                          {message.sourceDocs && (
                            <div
                              className="p-5"
                              key={`sourceDocsAccordion-${index}`}
                            >
                              <Accordion
                                type="single"
                                collapsible
                                className="flex-col"
                              >
                                {message.sourceDocs.map((doc, index) => (
                                  <div key={`messageSourceDocs-${index}`}>
                                    <AccordionItem value={`item-${index}`}>
                                      <AccordionTrigger>
                                        <h3>
                                          <div className={styles.source}>
                                            Source {index + 1}
                                          </div>
                                        </h3>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <ReactMarkdown linkTarget="_blank">
                                          {doc.pageContent}
                                        </ReactMarkdown>
                                        <p className="mt-2">
                                          <b>Source:</b> {doc.metadata.source}
                                        </p>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </div>
                                ))}
                              </Accordion>
                            </div>
                          )}
                        </>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.center}>
                  <div className={styles.cloudform}>
                    <form onSubmit={handleSubmit}>
                      <textarea
                        disabled={loading}
                        onKeyDown={handleEnter}
                        ref={textAreaRef}
                        autoFocus={false}
                        rows={1}
                        maxLength={512}
                        id="userInput"
                        name="userInput"
                        placeholder={
                          loading
                            ? 'Waiting for response...'
                            : 'Send a message.'
                        }
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={styles.textarea}
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className={styles.generatebutton}
                      >
                        {loading ? (
                          <div className={styles.loadingwheel}>
                            <LoadingDots color="#000" />
                          </div>
                        ) : (
                          // Send icon SVG in input field
                          <svg
                            viewBox="0 0 20 20"
                            className={styles.svgicon}
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                          </svg>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
                {error && (
                  <div className="border border-red-400 rounded-md p-4">
                    <p className="text-red-500">{error}</p>
                  </div>
                )}
              </main>
            </div>
          </div>

          <style jsx>{`
            hr {
              border: none;
              border-top: 1px solid #ccc;
            }

            @media (max-width: 767px) {
              .flex {
                flex-direction: column;
              }

              .flex-1 {
                margin-top: 1rem;
              }

              .overflow-y-auto {
                overflow-y: auto;
              }

              .z-10 {
                z-index: 10;
              }

              .z-20 {
                z-index: 20;
              }
            }
          `}</style>
        </div>

        {/* </div> */}
      </Layout>
    </>
  );
}

export async function getServerSideProps(context: any) {
  const req = context.req;
  const res = context.res;
  const token = getCookie('token', { req, res });
  if (!token) {
    return {
      redirect: {
        permanent: false,
        destination: '/',
      },
    };
  }

  return {
    props: { token: token },
  };
}
