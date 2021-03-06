import React, { useState } from 'react'
import Link from 'next/link'
import { isEmptyStr } from '@subsocial/utils'
import { formatUnixDate, IconWithLabel, isVisible } from '../../utils'
import { ViewSpace } from '../../spaces/ViewSpace'
import { DfBgImageLink } from '../../utils/DfBgImg'
import isEmpty from 'lodash.isempty'
import { EditOutlined, EllipsisOutlined, MessageOutlined } from '@ant-design/icons'
import { Menu, Dropdown, Button } from 'antd'
import { isMyAddress } from '../../auth/MyAccountContext'
import { Post, Space, PostExtension, PostId } from '@subsocial/types/substrate/interfaces'
import { SpaceData, PostWithSomeDetails, PostWithAllDetails, PostData } from '@subsocial/types/dto'
import { PostContent as PostContentType } from '@subsocial/types'
import ViewTags from '../../utils/ViewTags'
import AuthorPreview from '../../profiles/address-views/AuthorPreview'
import SummarizeMd from '../../utils/md/SummarizeMd'
import ViewPostLink from '../ViewPostLink'
import HiddenPostButton from '../HiddenPostButton'
import NoData from 'src/components/utils/EmptyList'
import { VoterButtons } from 'src/components/voting/VoterButtons'
import Segment from 'src/components/utils/Segment'
import { RegularPreview } from '.'
import { PostVoters, ActiveVoters } from 'src/components/voting/ListVoters'
import { isHidden } from '@subsocial/api/utils/visibility-filter'
import useSubsocialEffect from 'src/components/api/useSubsocialEffect'
import { Option } from '@polkadot/types'
import { resolveIpfsUrl } from 'src/ipfs'
import { useIsMobileWidthOrDevice } from 'src/components/responsive'
import { postUrl, editPostUrl, HasSpaceIdOrHandle, HasDataForSlug } from 'src/components/urls'
import { ShareDropdown } from '../share/ShareDropdown'
import { ButtonLink } from 'src/components/utils/ButtonLink'
import { DfMd } from 'src/components/utils/DfMd'
import { EntityStatusProps, HiddenEntityPanel } from 'src/components/utils/EntityStatusPanels'

type DropdownProps = {
  space: Space
  post: PostData
  withEditButton?: boolean
}

export const isRegularPost = (extension: PostExtension): boolean => extension.isRegularPost || (extension as any).RegularPost === null // Hack because SSR serializes objects and this drops all methods.
export const isSharedPost = (extension: PostExtension): boolean => extension.isSharedPost || (extension as any).SharedPost
export const isComment = (extension: PostExtension): boolean => extension.isComment || (extension as any).Comment

type ReactionModalProps = {
  postId: PostId
}

const ReactionModal = ({ postId }: ReactionModalProps) => {
  const [ open, setOpen ] = useState(false)

  return <>
    <span onClick={() => setOpen(true)}>View reactions</span>
    <PostVoters id={postId} active={ActiveVoters.All} open={open} close={() => setOpen(false)} />
  </>
}

export const PostDropDownMenu: React.FunctionComponent<DropdownProps> = (props) => {
  const { space, post, withEditButton = false } = props
  const { struct } = post
  const isMyPost = isMyAddress(struct.owner)
  const postId = struct.id
  const postKey = `post-${postId.toString()}`

  const editPostProps = {
    href: '/[spaceId]/[slug]/edit',
    as: editPostUrl(space, post)
  }

  const menu = (
    <Menu>
      {isMyPost && <Menu.Item key={`edit-${postKey}`}>
        <Link {...editPostProps}>
          <a className='item'>Edit post</a>
        </Link>
      </Menu.Item>}
      {isMyPost && <Menu.Item key={`hidden-${postKey}`}>
        <HiddenPostButton post={struct} asLink />
      </Menu.Item>}
      <Menu.Item key={`view-reaction-${postKey}`} >
        <ReactionModal postId={postId} />
      </Menu.Item>
      {/* {edit_history.length > 0 && <Menu.Item key='1'>
          <div onClick={() => setOpen(true)} >View edit history</div>
        </Menu.Item>} */}
    </Menu>
  )

  return <div className='text-nowrap'>
    <Dropdown overlay={menu} placement='bottomRight' className='mx-2'>
      <EllipsisOutlined />
    </Dropdown>
    {withEditButton && isMyPost &&
      <ButtonLink {...editPostProps} className='bg-transparent'>
        <EditOutlined /> Edit
      </ButtonLink>
    }
    {/* open && <PostHistoryModal id={id} open={open} close={close} /> */}
  </div>
}

type HiddenPostAlertProps = EntityStatusProps & {
  post: Post,
  space?: SpaceData
}

export const HiddenPostAlert = (props: HiddenPostAlertProps) => {
  const { post } = props
  const kind = isComment(post.extension) ? 'comment' : 'post'
  const PostAlert = () => <HiddenEntityPanel struct={post} type={kind} {...props} />

  // TODO fix view Space alert when space is hidden
  // const SpaceAlert = () => space && !isOnlyVisible(space.struct) ? <HiddenEntityPanel preview={preview} struct={space.struct} type='space' desc='This post is not visible because its space is hidden.' /> : null

  return <PostAlert />
}

export const renderPostLink = (space: HasSpaceIdOrHandle, post: HasDataForSlug, title?: string) =>
  <ViewPostLink space={space} post={post} title={title} className='DfBlackLink' />

type PostNameProps = {
  space: HasSpaceIdOrHandle,
  post: HasDataForSlug,
  title?: string,
  withLink?: boolean
}

export const PostName: React.FunctionComponent<PostNameProps> = ({ space, post, title, withLink }) => {
  if (!space?.id || !post?.struct.id || !title) return null

  return (
    <div className={'header DfPostTitle--preview'}>
      {withLink ? renderPostLink(space, post, title) : title}
    </div>
  )
}

type PostCreatorProps = {
  postDetails: PostWithSomeDetails,
  withSpaceName: boolean,
  space?: SpaceData
  size?: number,
}

export const PostCreator: React.FunctionComponent<PostCreatorProps> = ({ postDetails, size, withSpaceName, space }) => {
  if (isEmpty(postDetails.post)) return null
  const { post, owner } = postDetails
  const { created: { time }, owner: postOwnerAddress } = post.struct

  // TODO replace on loaded space after refactor this components

  return <>
    <AuthorPreview
      address={postOwnerAddress}
      owner={owner}
      withFollowButton
      isShort={true}
      isPadded={false}
      size={size}
      details={<div>
        {withSpaceName && space && <>
          <div className='DfGreyLink'>
            <ViewSpace spaceData={space} nameOnly withLink />
          </div>{' ??? '}</>
        }
        {space && <Link href='/[spaceId]/[slug]' as={postUrl(space.struct, post)}>
          <a className='DfGreyLink'>
            {formatUnixDate(time)}
          </a>
        </Link>}
      </div>}
    />
  </>
}

type PostImageProps = {
  post: PostData,
  space: Space
}

const PostImage = ({ post, space }: PostImageProps) => {
  const { content } = post
  const isMobile = useIsMobileWidthOrDevice()
  const image = content?.image

  if (!image || isEmptyStr(image)) return null

  return <DfBgImageLink
    href={'/[spaceId]/[slug]'}
    as={postUrl(space, post)}
    src={resolveIpfsUrl(image)}
    size={isMobile ? undefined : 170}
    className='DfPostImagePreview'
    // TODO add onError handler
    // TODO lazy load image.
  />
}

type PostContentProps = {
  postDetails: PostWithSomeDetails,
  space: Space,
  content?: PostContentType
  withImage?: boolean
}

export const PostContent: React.FunctionComponent<PostContentProps> = (props) => {
  const { postDetails, content, space, withImage } = props
  const isMobile = useIsMobileWidthOrDevice()

  if (!postDetails) return null

  const { post } = postDetails
  const postContent = content || postDetails.post.content

  if (!postContent) return null

  const { title, body } = postContent

  return <div className='DfContent'>
    {isMobile && withImage && <PostImage post={post} space={space} />}
    <PostName space={space} post={post} title={title} withLink />
    <SummarizeMd md={body} more={renderPostLink(space, post, 'See More')} />
  </div>
}

type PostActionsPanelProps = {
  postDetails: PostWithSomeDetails,
  space: Space,
  toogleCommentSection?: () => void,
  preview?: boolean,
  withBorder?: boolean
}

const ShowCommentsAction = ({ postDetails, preview, toogleCommentSection }: PostActionsPanelProps) => {
  const { post: { struct: { replies_count } } } = postDetails
  const title = 'Comment'

  return <Action onClick={toogleCommentSection} title={title}>
    <IconWithLabel
      icon={<MessageOutlined />}
      count={replies_count}
      label={!preview ? title : undefined}
    />
  </Action>
}

const Action: React.FunctionComponent<{ onClick?: () => void, title?: string }> =
  ({ children, onClick, title }) =>
    <Button onClick={onClick} title={title} className='DfAction'>{children}</Button>

export const PostActionsPanel: React.FunctionComponent<PostActionsPanelProps> = (props) => {
  const { postDetails, space, preview, withBorder } = props
  const { post: { struct } } = postDetails

  const ReactionsAction = () =>
    <VoterButtons post={struct} className='DfAction' preview={preview} />

  return (
    <div className={`DfActionsPanel ${withBorder && 'DfActionBorder'}`}>
      {preview
        ? <ReactionsAction />
        : <div className='d-flex DfReactionsAction'>
          <ReactionsAction />
        </div>}
      {preview && <ShowCommentsAction {...props} />}
      <ShareDropdown postDetails={postDetails} space={space} className='DfAction' preview={preview} />
    </div>
  )
}

type PostPreviewProps = {
  postDetails: PostWithSomeDetails
  space: SpaceData
  withImage?: boolean
  withTags?: boolean
}

const SharedPostMd = (props: PostPreviewProps) => {
  const { postDetails: { post }, space } = props
  const { struct, content } = post

  return isComment(struct.extension)
    ? <DfMd source={content?.body} className='DfPostBody' />
    : <SummarizeMd md={content?.body} more={renderPostLink(space.struct, post, 'See More')} />
}

export const SharePostContent = (props: PostPreviewProps) => {
  const { postDetails: { ext } } = props

  const OriginalPost = () => {
    if (!ext || !ext.space) return <PostNotFound />

    const originalPost = ext.post.struct

    return <>
      {isVisible({ struct: originalPost, address: originalPost.owner })
        ? <RegularPreview postDetails={ext as PostWithAllDetails} space={ext.space} />
        : <PostNotFound />
      }
    </>
  }

  return <div className='DfSharedSummary'>
    <SharedPostMd {...props} />
    <Segment className='DfPostPreview'>
      <OriginalPost />
    </Segment>
  </div>
}

export const InfoPostPreview: React.FunctionComponent<PostPreviewProps> = (props) => {
  const { postDetails, space, withImage = true, withTags } = props
  const { post: { struct, content } } = postDetails
  const isMobile = useIsMobileWidthOrDevice()

  if (!struct || !content) return null

  return <div className='DfInfo'>
    <div className='DfRow'>
      <div className='w-100'>
        <div className='DfRow'>
          <PostCreator postDetails={postDetails} space={space} withSpaceName />
          <PostDropDownMenu post={postDetails.post} space={space.struct} withEditButton />
        </div>
        <PostContent postDetails={postDetails} space={space.struct} withImage={withImage} />
        {withTags && <ViewTags tags={content?.tags} />}
        {/* {withStats && <StatsPanel id={post.id}/>} */}
      </div>
      {!isMobile && withImage && <PostImage post={postDetails.post} space={space.struct} />}
    </div>
  </div>
}

export const PostNotFound = () => <NoData description='Post not found' />

export const isHiddenPost = (post: Post) => isHidden(post)

export const useSubscribedPost = (initPost: Post) => {
  const [ post, setPost ] = useState(initPost)

  useSubsocialEffect(({ substrate: { api } }) => {
    let unsub: { (): void | undefined; (): void; }

    const sub = async () => {
      const readyApi = await api
      unsub = await readyApi.query.posts.postById(initPost.id, (data: Option<Post>) => {
        setPost(data.unwrapOr(post))
      })
    }

    sub()

    return () => unsub && unsub()
  }, [ initPost.id.toString() ])

  return post
}