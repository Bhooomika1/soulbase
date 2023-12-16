'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Loader2, ListMusic, Newspaper,
  PersonStanding, Shapes, Share, Globe,
  MessageSquare, Repeat2, Heart, Grab, ArrowRight
} from "lucide-react"
import { Button, buttonVariants } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ReactMarkdown from 'react-markdown'
import NewPostForm from '@/components/NewPostForm'
import { useSession } from 'next-auth/react';

export default function Home() {
  const [view, setView] = useState('feed')
  const [dashboardType, setDashboardType] = useState('dashboard')

  const [users, setUsers] = useState<any>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [posts, setPosts] = useState<any>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const { data: session } = (useSession() || {}) as any;

  const currentUserAddress = session?.user?.address;
  const currentUser = users.find(user => user.address === currentUserAddress);
  const userPosts = posts.filter(post => post.creator.address === currentUserAddress);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users/all/f');
        const data = await response.json();
        console.log("Creators: ", data)
        setUsers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/post/all/f');
        const data = await response.json();
        console.log("Posts: ", data);

        const sortedPosts = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const postDataWithImages = await Promise.all(sortedPosts.map(async post => {
          const imageResponse = await fetch(`/api/post/${post.cid}`);
          const imageData = await imageResponse.json();
          console.log("Image: ", imageData);
          return {
            ...post,
            imageCid: imageData.cid,
            content: imageData.content
          };
        }));

        setPosts(postDataWithImages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <main className="
      px-6 py-14
      sm:px-10
      max-w-7xl mx-auto
    ">
      {
        dashboardType === 'dashboard' && (      <div className='md:flex min-h-[300px] mt-3'>
        <div className="border border rounded-tl rounded-bl md:w-[230px] pt-3 px-2 pb-8 flex-col flex">
          <p className='font-medium ml-4 mb-2 mt-1'>Social Views</p>
          <Button
            onClick={() => setView('feed')}
            variant={view === 'feed' ? 'secondary': 'ghost'} className="justify-start mb-1">
            <Newspaper size={16} />
            <p className="text-sm ml-2">Feed</p>
          </Button>
          <Button
            onClick={() => setView('creators')}
           variant={view === 'creators' ? 'secondary': 'ghost'} className="justify-start mb-1">
            <PersonStanding size={16} />
            <p className="text-sm ml-2">Creators</p>
          </Button>
          <Button
            onClick={() => setView('profile')}
            variant={view === 'profile' ? 'secondary': 'ghost'} 
            className="justify-start mb-1">
            <Shapes size={16} />
            <p className="text-sm ml-2">My Profile</p>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='ghost' className="justify-start mb-1 bg-gray-100 text-black hover:bg-gray-200 hover:text-black">
                <Newspaper size={16} />
                <p className="text-sm ml-2">Post</p>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Post</AlertDialogTitle>
                <AlertDialogDescription>
                  <NewPostForm/>
                </AlertDialogDescription>
              </AlertDialogHeader>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div
          className="
          sm:border-t sm:border-r sm:border-b
          rounded-tr rounded-br flex flex-1 pb-4">
          {
            view === 'feed' && (
              <div className="flex flex-1 flex-wrap flex-col">
                {
                  loadingPosts && (
                    <div className="
                      flex flex-1 justify-center items-center
                    ">
                      <Loader2 className="h-12 w-12 animate-spin" />
                    </div>
                  )
                }
                {posts.map(post => (
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-b"
                    key={post.cid}
                    href={post.transactionUrl}
                  >
                    <div className="space-y-3 mb-4 pt-6 pb-2 sm:px-6 px-2">
                      <div className="flex items-center">
                        <Avatar className='h-12 w-12'>
                          <AvatarImage src={`https://gateway.lighthouse.storage/ipfs/${post.creator.profilePicture}`} />
                          <AvatarFallback>{post.creator.name}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <h3 className="mb-1 font-medium leading-none">{post.creator.username}</h3>
                          <p className="text-xs text-muted-foreground">{post.creator.name}</p>
                        </div>
                      </div>
                      <div>
                        <img
                          className="max-w-full sm:max-w-[500px] rounded-2xl h-auto object-cover transition-all hover:scale-105"
                          src={`https://gateway.lighthouse.storage/ipfs/${post.imageCid}`}
                          alt={`Post by ${post.creator.name}`}
                        />
                      </div>
                      <div>
                        <ReactMarkdown className="mt-4 break-words">
                          {post.content.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '[LINK]($1)')}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )
          }
          {
            view === 'creators' && (
              <div className="flex flex-1 flex-wrap p-4">
                {
                  loadingUsers && (
                    <div className="
                      flex flex-1 justify-center items-center
                    ">
                      <Loader2 className="h-12 w-12 animate-spin" />
                    </div>
                  )
                }
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {users?.map(user => (
                    <div className="space-y-3" key={user.address}>
                      <div className="overflow-hidden rounded-md">
                        <img 
                          alt="Thinking Components" 
                          loading="lazy" 
                          decoding="async" 
                          data-nimg="1" 
                          className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-square" 
                          src={`https://gateway.lighthouse.storage/ipfs/${user.profilePicture}`} 
                        />
                      </div>
                      <div className="space-y-1 text-sm">
                        <h3 className="font-medium leading-none">{user.username}</h3>
                        <p className="text-xs text-muted-foreground">{user.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
          {/* {
            view === 'profile' && currentUser && (
              <div className="w-full">
                <div className="relative">
                  <div className="bg-gradient-to-r from-gray-700 to-purple-1000 h-40"></div>
                  <div className="absolute top-1/2 left-12 transform -translate-y-1/2">
                    <Avatar className="rounded-xl overflow-hidden w-40 h-40 border-2 border-white">
                      <AvatarImage
                        src={`https://gateway.lighthouse.storage/ipfs/${currentUser.profilePicture}`}
                        // className="w-24 h-24 object-cover"
                      />
                    </Avatar>
                  </div>
                  <div className="mt-20 ml-12">
                    <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                    <p className="text-md text-gray-400">@{currentUser.username}</p>
                  </div>
                </div>
              </div>
            )
          } */}
          {
            view === 'profile' && currentUser && (
              <div className="w-full">
                <div className="relative">
                  <div className="bg-gradient-to-r from-purple-950 to-black h-40"></div>

                  <div className="absolute top-20 left-12">
                    <Avatar className="rounded-xl overflow-hidden w-40 h-40 border-4 border-black">
                      <AvatarImage
                        src={`https://gateway.lighthouse.storage/ipfs/${currentUser.profilePicture}`}
                      />
                    </Avatar>
                  </div>

                  <div className="absolute top-44 left-60">
                    <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                    <p className="text-md text-zinc-400">@{currentUser.username}</p>
                  </div>

                  <div className="border-t border-neutral-800 mt-28"></div> {/* Adjust styles as needed */}

                  <div className='flex flex-1 flex-wrap flex-col'>
                    {userPosts.map(post => (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border-b"
                        key={post.cid}
                        href={post.transactionUrl}
                      >
                        <div className="space-y-3 mb-4 pt-6 pb-2 sm:px-6 px-2">
                          <div>
                            <img
                              className="max-w-full sm:max-w-[500px] rounded-2xl h-auto object-cover transition-all hover:scale-105"
                              src={`https://gateway.lighthouse.storage/ipfs/${post.imageCid}`}
                              alt={`Post by ${post.creator.name}`}
                            />
                          </div>
                          <div>
                            <ReactMarkdown className="mt-4 break-words">
                              {post.content.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, '[LINK]($1)')}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )
          }
        </div>
      </div>)
      }
    </main>
  )
}
