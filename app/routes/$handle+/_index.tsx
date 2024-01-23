import {
  ClientActionFunctionArgs,
  ClientLoaderFunctionArgs,
  Form,
  Link,
  redirect,
  useLoaderData,
} from '@remix-run/react'
import { PlusIcon } from 'lucide-react'
import { MoreVerticalIcon } from 'lucide-react'
import React from 'react'
import { AppHeadingSection } from '~/components/AppHeadingSection'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui'
import { dayjs } from '~/libs/dayjs'
import { type Post, addUserPost, listUserPosts } from '~/models/posts'
import { isAuthenticated, requireUser } from '~/services/auth'
import { DeleteAlertDialog } from './posts.$id.delete'

export const clientLoader = async ({
  request,
  params,
}: ClientLoaderFunctionArgs) => {
  const handle = params.handle
  if (!handle) throw new Error('Not found')

  const user = await isAuthenticated(request)
  const posts = await listUserPosts(handle)
  return { handle, user, posts, isAuthor: handle === user?.handle }
}

export const clientAction = async ({
  params,
  request,
}: ClientActionFunctionArgs) => {
  const handle = params.handle
  const user = await requireUser(request, { failureRedirect: '/' })
  if (user.handle !== handle) {
    throw new Error('Unauthorized')
  }

  const newPost = await addUserPost(user.handle)
  return redirect(`/${handle}/posts/${newPost.id}/edit`)
}

const PostCard = ({ handle, post }: { handle: string; post: Post }) => {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false)

  const handleClickDeleteMenu = () => {
    setIsDeleteAlertOpen(true)
  }

  return (
    <Card
      key={post.id}
      className="border-none relative rounded-xl bg-slate-100"
    >
      <Link
        to={`posts/${post.id}`}
        className="absolute inset-0"
        prefetch="intent"
      >
        &nbsp;
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger className="absolute right-0" asChild>
          <Button size="sm" variant="ghost">
            <MoreVerticalIcon className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => handleClickDeleteMenu()}
          >
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteAlertDialog
        handle={handle}
        post={post}
        open={isDeleteAlertOpen}
        onCanceled={() => setIsDeleteAlertOpen(false)}
      />

      <CardHeader>
        <div className="mx-auto flex flex-col gap-[2px] overflow-clip bg-white shadow-md w-20 h-24 p-[8px]">
          <div className="text-[4px]">{post.title}</div>
          <div className="text-[2px] line-clamp-6">{post.content}</div>
        </div>
      </CardHeader>
      <CardContent className="leading-loose">
        <div className="line-clamp-2">{post.title}</div>
        <div className="text-sm text-slate-400">
          {dayjs(post.publishedAt).format('YYYY/MM/DD')}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Index() {
  const { handle, posts, isAuthor } = useLoaderData<typeof clientLoader>()
  return (
    <AppHeadingSection>
      <div className="flex">
        <h1 className="text-2xl flex-1">@{handle}</h1>
        {isAuthor && (
          <Form method="POST">
            <Button
              variant="outline"
              className="rounded-full px-2"
              type="submit"
            >
              <PlusIcon />
            </Button>
          </Form>
        )}
      </div>

      <div className="w-full gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {posts.map((post) => (
          <PostCard key={post.id} handle={handle} post={post} />
        ))}
      </div>
    </AppHeadingSection>
  )
}
