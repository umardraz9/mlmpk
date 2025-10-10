import { redirect } from 'next/navigation';

export default function VideosPage() {
  // Redirect Videos to Reels for now
  redirect('/social/reels');
}
