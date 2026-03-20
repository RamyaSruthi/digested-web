export type { Profile, Folder, Link, LinkTag, LinkStatus, ContentType, Highlight, Database } from "./database";
import type { Folder } from "./database";

export interface FolderWithCount extends Folder {
  link_count: number;
}
