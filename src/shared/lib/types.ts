// Client-side data shapes (serialized form of the Mongoose models). Fields are
// optional because the API may populate/omit them; the index signature allows
// extra serialized fields without resorting to `any`.

export interface ArtworkAuthor {
  _id?: string
  username?: string
  displayName?: string
  avatarUrl?: string
}

export interface ArtworkComment {
  _id?: string
  text?: string
  authorId?: ArtworkAuthor
  createdAt?: string
}

export interface Artwork {
  _id: string
  title?: string
  artistId?: ArtworkAuthor
  uploadDate?: string
  creationDate?: { type?: string; value?: string; certainty?: string }
  artistProvidedDateText?: string
  description?: string
  category?: string
  medium?: string
  technique?: string
  materials?: string[]
  dimensions?: { width?: number; height?: number; depth?: number; unit?: string }
  edition?: { type?: string; number?: number; total?: number }
  signature?: boolean
  signatureLocation?: string
  provenance?: string
  visibility?: string
  altText?: string
  licenseRights?: { copyrightHolder?: string; licenseType?: string; licenseUrl?: string }
  tags?: string[]
  imageUrl: string
  fileMeta?: Record<string, unknown>
  thumbnails?: { small?: string; medium?: string; large?: string }
  likes?: number
  views?: number
  comments?: ArtworkComment[]
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface Collection {
  _id: string
  name: string
  description?: string
  isPrivate?: boolean
  artworks: string[]
  references?: { imageUrl: string; caption?: string }[]
}
