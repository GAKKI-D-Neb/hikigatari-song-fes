export type Work = {
  videoId: string;
  title: string;
  creator: string;
  url: string;
  xAccount: string | null;
  announcementPostUrl: string | null;
  vocals: string[];
  instruments: string[];
  description: string;
};

export type Comment = {
  commentId: string;
  videoId: string;
  authorName: string;
  comment: string;
  submittedAt: string;
};
